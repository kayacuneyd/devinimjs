<?php

declare(strict_types=1);

namespace Config;

use CodeIgniter\Database\Config;

/**
 * Database Configuration (roadmap 2.7 / ADR-003)
 *
 * Default group is a single-file SQLite database living at
 * writable/database.sqlite — zero-config, shared-hosting friendly.
 * Override any value from .env (see env.example), e.g. to switch to MySQL.
 */
class Database extends Config
{
    /**
     * The directory that holds the Migrations and Seeds directories.
     */
    public string $filesPath = APPPATH . 'Database' . DIRECTORY_SEPARATOR;

    /**
     * Lets you choose which connection group to use by default.
     */
    public string $defaultGroup = 'default';

    /**
     * The default database connection: SQLite3, one file under writable/.
     *
     * @var array<string, mixed>
     */
    public array $default = [
        'DSN'      => '',
        'hostname' => '',
        'username' => '',
        'password' => '',
        'database' => WRITEPATH . 'database.sqlite',
        'DBDriver' => 'SQLite3',
        'DBPrefix' => '',
        'DBDebug'  => true, // appstarter sets ENVIRONMENT to production on deploy, which flips error display off; keep DBDebug true only while developing
        'charset'  => 'utf8',
        'DBCollat' => 'utf8_general_ci',
        'swapPre'  => '',
        'encrypt'  => false,
        'compress' => false,
        'strictOn' => false,
        'failover' => [],
        'port'     => 3306,
    ];

    /**
     * In-memory SQLite connection for PHPUnit runs.
     *
     * @var array<string, mixed>
     */
    public array $tests = [
        'DSN'      => '',
        'hostname' => '',
        'username' => '',
        'password' => '',
        'database' => ':memory:',
        'DBDriver' => 'SQLite3',
        'DBPrefix' => '',
        'DBDebug'  => true,
        'charset'  => 'utf8',
        'DBCollat' => 'utf8_general_ci',
        'swapPre'  => '',
        'encrypt'  => false,
        'compress' => false,
        'strictOn' => false,
        'failover' => [],
        'port'     => 3306,
    ];

    public function __construct()
    {
        parent::__construct();

        // Shared-hosting friendly .env overrides (all optional — the defaults
        // above are already a working SQLite setup).
        $database = env('database.default.database');
        if (is_string($database) && $database !== '') {
            $this->default['database'] = $database;
        }

        $driver = env('database.default.DBDriver');
        if (is_string($driver) && $driver !== '') {
            $this->default['DBDriver'] = $driver;
        }

        // Never leak DB errors on a production box.
        if (ENVIRONMENT === 'production') {
            $this->default['DBDebug'] = false;
        }

        // Under `phpunit` we always want the throwaway in-memory database.
        if (ENVIRONMENT === 'testing') {
            $this->defaultGroup = 'tests';
        }
    }
}
