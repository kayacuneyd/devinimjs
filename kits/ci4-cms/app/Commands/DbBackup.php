<?php

declare(strict_types=1);

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/**
 * db:backup — one-file SQLite backup (roadmap 2.7).
 *
 * Copies writable/database.sqlite to
 * writable/backups/database_<YYYY-mm-dd_H-i-s>.sqlite, creating the
 * backups directory when missing. Schedule it with cron on shared
 * hosting, e.g.:  php spark db:backup  (daily)
 *
 * Note: this is a straight file copy — perfectly safe for the small
 * sites this kit targets. If the site is write-heavy, run it at
 * low-traffic hours (WAL mode keeps reads unblocked during the copy).
 */
class DbBackup extends BaseCommand
{
    /**
     * The Command's Group.
     *
     * @var string
     */
    protected $group = 'Database';

    /**
     * The Command's Name.
     *
     * @var string
     */
    protected $name = 'db:backup';

    /**
     * The Command's Description.
     *
     * @var string
     */
    protected $description = 'Copies the SQLite database file to writable/backups with a timestamp.';

    /**
     * The Command's Usage.
     *
     * @var string
     */
    protected $usage = 'db:backup';

    /**
     * The Command's Arguments.
     *
     * @var array<string, string>
     */
    protected $arguments = [];

    /**
     * The Command's Options.
     *
     * @var array<string, string>
     */
    protected $options = [];

    /**
     * Actually execute the command.
     *
     * @param list<string> $params
     */
    public function run(array $params): void
    {
        $source = WRITEPATH . 'database.sqlite';

        if (! is_file($source)) {
            CLI::error('Database file not found: ' . $source);
            CLI::write('Run "php spark migrate --all" first to create it.', 'yellow');

            return;
        }

        $backupDir = WRITEPATH . 'backups';
        if (! is_dir($backupDir) && ! mkdir($backupDir, 0755, true) && ! is_dir($backupDir)) {
            CLI::error('Could not create backup directory: ' . $backupDir);

            return;
        }

        $dest = $backupDir . DIRECTORY_SEPARATOR . 'database_' . date('Y-m-d_H-i-s') . '.sqlite';

        if (! copy($source, $dest)) {
            CLI::error('Backup failed: could not copy to ' . $dest);

            return;
        }

        CLI::write('Backup created: ' . $dest, 'green');
        CLI::write('Size: ' . number_format((float) filesize($dest) / 1024, 1) . ' KB');
    }
}
