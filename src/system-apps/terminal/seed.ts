import type { Identity } from './types'
import { bootTime, dir, file, type DirNode } from './fsnodes'

const DAY = 86400e3
const ago = (ms: number) => Date.now() - ms
const binary = (size: number, age: number) => file('', ago(age), { binary: true, size })

/** The starting filesystem. Built fresh for each user on first use. */
export function seedFiles({ user, host, home }: Identity): DirNode {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const homeName = home.split('/').pop() ?? user

  const homeDir = dir(
    {
      '.plushrc': file(
        ['# plush startup file', 'export EDITOR=nano', "alias ll='ls -l'", "alias la='ls -la'", ''].join('\n'),
        ago(40 * DAY),
      ),
      'README.md': file(
        [
          '# Welcome to Plumos',
          '',
          `This is your home folder on ${host}. Everything in it lives on your`,
          'own server, not in someone else’s cloud.',
          '',
          '- Documents, Photos and Music show up in the Files app too',
          '- Apps you install from the App Store appear under /apps',
          '- System settings live in /etc/plumos.conf',
          "- Type 'help' to see what this terminal can do",
          '',
        ].join('\n'),
        ago(40 * DAY),
      ),
      'todo.txt': file(
        [
          '[x] Move the photos off the old laptop',
          '[x] Plug in the 2009 backup drive and import everything',
          '[x] Map the server as a network drive on the Mac',
          '[ ] Make accounts for Ava and Leo',
          '[ ] Try a local model in Ollama',
          "[ ] Scan grandma's slides",
          '',
        ].join('\n'),
        ago(2 * 3600e3),
      ),
      Documents: dir(
        {
          'recipes.md': file(
            [
              '# Sunday plum cake',
              '',
              '- 12 ripe plums, halved',
              '- 200 g flour, 150 g butter, 120 g sugar',
              '- 3 eggs, 1 tsp cinnamon',
              '',
              'Bake at 180 °C for 45 minutes. Better the next day.',
              '',
            ].join('\n'),
            ago(9 * DAY),
          ),
          'taxes-2025.pdf': binary(1_482_113, 120 * DAY),
          'lease-agreement.pdf': binary(684_220, 300 * DAY),
          'wifi.txt': file(`Network: ${homeName}-home\nPassword: ask ${user} :)\n`, ago(60 * DAY)),
        },
        ago(9 * DAY),
      ),
      Photos: dir(
        {
          '2009-summer-lake.jpg': binary(4_210_331, 400 * DAY),
          '2014-wedding.jpg': binary(6_882_004, 380 * DAY),
          '2021-first-steps.mov': binary(184_220_910, 320 * DAY),
          '2026-birthday.heic': binary(3_104_778, 30 * DAY),
        },
        ago(30 * DAY),
      ),
      Music: dir(
        { 'mixtape-1998': dir({ 'side-a.flac': binary(38_991_220, 500 * DAY) }, ago(500 * DAY)) },
        ago(500 * DAY),
      ),
      Downloads: dir(
        {
          'plumos-backup-2026-08.tar.gz': binary(2_114_880_512, 27 * DAY),
          'router-manual.pdf': binary(3_390_441, 90 * DAY),
        },
        ago(27 * DAY),
      ),
    },
    ago(2 * 3600e3),
  )

  return dir(
    {
      apps: dir({}, bootTime()),
      bin: dir({}, bootTime()),
      etc: dir(
        {
          'plumos.conf': file(
            [
              '# Plumos system configuration',
              '# Change these from Settings; edits here are overwritten.',
              '',
              '[system]',
              `hostname = ${host}`,
              `timezone = ${tz}`,
              'updates = automatic',
              '',
              '[storage]',
              'pool = combined',
              'drives = nvme0, nvme1',
              'snapshots = daily',
              '',
              '[network]',
              `mdns = ${host}.local`,
              'file_sharing = smb',
              'remote_access = off',
              '',
              '[users]',
              `admin = ${user}`,
              'members = ava, leo',
              '',
            ].join('\n'),
            ago(3 * DAY),
          ),
          hostname: file(`${host}\n`, bootTime()),
          'os-release': file(
            [
              'NAME="Plumos"',
              'VERSION="1.0"',
              'ID=plumos',
              'ID_LIKE=debian',
              'PRETTY_NAME="Plumos 1.0 (Debian 13)"',
              '',
            ].join('\n'),
            bootTime(),
          ),
        },
        ago(3 * DAY),
      ),
      home: dir({ [homeName]: homeDir }, ago(40 * DAY)),
      tmp: dir({}, ago(3600e3)),
      var: dir({ log: dir({ 'plumos.log': file(systemLog(user, host), ago(60e3)) }, ago(60e3)) }, bootTime()),
    },
    bootTime(),
  )
}

/** Plausible recent log lines, newest last. */
function systemLog(user: string, host: string): string {
  const lines: [number, string, string][] = [
    [190, 'INFO', 'plumosd[812]: Plumos 1.0 starting on ' + host],
    [189, 'INFO', 'storage[840]: pool online — 2 drives, combined mode, 2.0 TB'],
    [188, 'INFO', 'network[851]: announced ' + host + '.local on the local network'],
    [187, 'INFO', 'smb[902]: file sharing ready (Family, ' + user + ')'],
    [186, 'INFO', 'apps[915]: starting 12 apps'],
    [183, 'INFO', 'apps[915]: immich ready on :2283'],
    [182, 'INFO', 'apps[915]: jellyfin ready on :8096'],
    [181, 'WARN', 'apps[915]: home-assistant took 41s to start (integrations loading)'],
    [150, 'INFO', 'backup[1204]: 1,284 photos backed up from "' + user + '’s phone"'],
    [122, 'INFO', 'smb[902]: 192.168.1.23 connected as ' + user],
    [97, 'INFO', 'import[1388]: "Old Backup Drive" connected (USB, 500 GB)'],
    [96, 'INFO', 'import[1388]: 18,402 files imported to /home/' + user + '/Photos'],
    [61, 'WARN', 'storage[840]: SSD 2 is warm (43 °C) — airflow looks fine'],
    [44, 'INFO', 'updates[1502]: 3 app updates available'],
    [12, 'INFO', 'vm[1630]: windows started (4 vCPU, 8 GB)'],
    [3, 'INFO', 'ssh[1711]: session opened for ' + user + ' from 192.168.1.23'],
  ]
  return lines
    .map(
      ([minutes, level, text]) =>
        `${new Date(ago(minutes * 60e3)).toISOString().slice(0, 19)}Z ${level.padEnd(4)} ${text}`,
    )
    .join('\n')
    .concat('\n')
}
