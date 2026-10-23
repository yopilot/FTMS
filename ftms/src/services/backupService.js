import db from '../db/database';
import { listKeys, readJSON, writeJSON, removeKey } from '../lib/storage';

// Everything the app stores on this device:
//  - IndexedDB (Dexie): the custom club's players, matches and stats
//  - localStorage: settings, follows, manager session, lineups/tactics per club
// Cached API responses (cache.*) are skipped; they rebuild themselves.

const TABLES = ['players', 'matches', 'statDefinitions', 'playerStats', 'settings'];

function localSnapshot() {
  const out = {};
  listKeys()
    .filter((k) => !k.startsWith('cache.') && k !== 'session')
    .forEach((k) => {
      out[k] = readJSON(k, null);
    });
  return out;
}

export const backupService = {
  async exportData() {
    const [players, matches, statDefinitions, playerStats, settings] = await Promise.all(TABLES.map((t) => db[t].toArray()));
    return {
      schemaVersion: 2,
      appName: 'FTMS',
      exportedAt: new Date().toISOString(),
      data: { players, matches, statDefinitions, playerStats, settings },
      local: localSnapshot(),
    };
  },

  async downloadBackup() {
    const backup = await this.exportData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ftms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    await db.settings.put({ key: 'lastBackup', value: new Date().toISOString() });
    return backup;
  },

  validateBackup(json) {
    if (!json || typeof json !== 'object') throw new Error('This file is not a valid backup.');
    if (!json.schemaVersion || !json.data) throw new Error('This file is missing the backup data. Was it exported from FTMS?');
    const { players, matches, statDefinitions, playerStats } = json.data;
    if (!Array.isArray(players) || !Array.isArray(matches)) throw new Error('The backup is damaged: players and matches must be lists.');
    return {
      isValid: true,
      schemaVersion: json.schemaVersion,
      exportedAt: json.exportedAt || null,
      summary: {
        playersCount: players.length,
        matchesCount: matches.length,
        statDefinitionsCount: Array.isArray(statDefinitions) ? statDefinitions.length : 0,
        playerStatsCount: Array.isArray(playerStats) ? playerStats.length : 0,
        localKeys: json.local ? Object.keys(json.local).length : 0,
      },
    };
  },

  async restoreData(json) {
    this.validateBackup(json);
    const { players = [], matches = [], statDefinitions = [], playerStats = [], settings = [] } = json.data;

    await db.transaction('rw', TABLES.map((t) => db[t]), async () => {
      await Promise.all(TABLES.map((t) => db[t].clear()));
      if (players.length) await db.players.bulkAdd(players);
      if (matches.length) await db.matches.bulkAdd(matches);
      if (statDefinitions.length) await db.statDefinitions.bulkAdd(statDefinitions);
      if (playerStats.length) await db.playerStats.bulkAdd(playerStats);
      if (settings.length) await db.settings.bulkAdd(settings);
      await db.settings.put({ key: 'lastRestored', value: new Date().toISOString() });
    });

    if (json.local && typeof json.local === 'object') {
      Object.entries(json.local).forEach(([k, v]) => {
        if (!k.startsWith('cache.') && k !== 'session') writeJSON(k, v);
      });
    }
    return true;
  },

  async getStorageInfo() {
    const [lastBackup, lastRestored, playersCount, matchesCount, statsCount] = await Promise.all([
      db.settings.get('lastBackup'),
      db.settings.get('lastRestored'),
      db.players.count(),
      db.matches.count(),
      db.playerStats.count(),
    ]);
    return {
      playersCount,
      matchesCount,
      statsCount,
      lastBackup: lastBackup?.value || null,
      lastRestored: lastRestored?.value || null,
    };
  },

  /** Wipes everything stored on this device and reloads. */
  async resetEverything() {
    await db.delete();
    listKeys().forEach((k) => removeKey(k));
  },
};
