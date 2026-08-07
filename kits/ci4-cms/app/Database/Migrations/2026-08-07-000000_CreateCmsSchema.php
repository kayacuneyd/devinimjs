<?php

declare(strict_types=1);

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

/**
 * Full CMS schema in a single migration (roadmap 2.3 + 2.6).
 *
 * Tables: users, content_types, fields, contents, media.
 *
 * SQLite notes:
 *  - INTEGER + auto_increment + primary key becomes
 *    "INTEGER PRIMARY KEY AUTOINCREMENT" via CI4 Forge.
 *  - The CHECK(...) lists from the roadmap SQL (fields.field_type,
 *    contents.status) are enforced at the application layer instead —
 *    request validation + FieldFactory — which keeps the schema portable
 *    across Forge versions and allows new field types without ALTER TABLE.
 *  - Foreign keys are declared as plain indexed columns; cascades are
 *    handled explicitly in the controllers (SQLite ships with
 *    PRAGMA foreign_keys off, so ON DELETE CASCADE would not fire anyway).
 */
class CreateCmsSchema extends Migration
{
    public function up(): void
    {
        // --------------------------------------------------------------
        // users (roadmap 2.2)
        // --------------------------------------------------------------
        $this->forge->addField([
            'id'         => ['type' => 'INTEGER', 'auto_increment' => true],
            'name'       => ['type' => 'TEXT', 'null' => false],
            'email'      => ['type' => 'TEXT', 'null' => false],
            'password'   => ['type' => 'TEXT', 'null' => false],
            'created_at' => ['type' => 'DATETIME', 'null' => true, 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('email', false, true); // UNIQUE
        $this->forge->createTable('users', true);

        // --------------------------------------------------------------
        // content_types (roadmap 2.3)
        // --------------------------------------------------------------
        $this->forge->addField([
            'id'          => ['type' => 'INTEGER', 'auto_increment' => true],
            'name'        => ['type' => 'TEXT', 'null' => false],
            'slug'        => ['type' => 'TEXT', 'null' => false],
            'description' => ['type' => 'TEXT', 'null' => true],
            'icon'        => ['type' => 'TEXT', 'null' => true],
            'created_at'  => ['type' => 'DATETIME', 'null' => true, 'default' => new RawSql('CURRENT_TIMESTAMP')],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('slug', false, true); // UNIQUE
        $this->forge->createTable('content_types', true);

        // --------------------------------------------------------------
        // fields (roadmap 2.3) — dynamic field definitions per type;
        // config is a JSON object: {options: [...], required: true, ...}
        // --------------------------------------------------------------
        $this->forge->addField([
            'id'         => ['type' => 'INTEGER', 'auto_increment' => true],
            'type_id'    => ['type' => 'INTEGER', 'null' => false],
            'name'       => ['type' => 'TEXT', 'null' => false],
            'label'      => ['type' => 'TEXT', 'null' => true],
            'field_type' => ['type' => 'TEXT', 'null' => false],
            'config'     => ['type' => 'TEXT', 'null' => true],
            'sort_order' => ['type' => 'INTEGER', 'null' => false, 'default' => 0],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('type_id');
        $this->forge->createTable('fields', true);

        // --------------------------------------------------------------
        // contents (roadmap 2.3) — one row per record; `data` holds the
        // dynamic field values as JSON (SQLite JSON1 can query into it:
        //   SELECT * FROM contents WHERE json_extract(data, '$.x') = 'y')
        // --------------------------------------------------------------
        $this->forge->addField([
            'id'           => ['type' => 'INTEGER', 'auto_increment' => true],
            'type_id'      => ['type' => 'INTEGER', 'null' => false],
            'title'        => ['type' => 'TEXT', 'null' => false],
            'slug'         => ['type' => 'TEXT', 'null' => false],
            'status'       => ['type' => 'TEXT', 'null' => false, 'default' => 'draft'],
            'author_id'    => ['type' => 'INTEGER', 'null' => true],
            'data'         => ['type' => 'TEXT', 'null' => false],
            'created_at'   => ['type' => 'DATETIME', 'null' => true, 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
            'published_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('slug', false, true); // UNIQUE
        $this->forge->addKey('type_id');
        $this->forge->addKey('status');
        $this->forge->addKey('published_at');
        $this->forge->createTable('contents', true);

        // --------------------------------------------------------------
        // media (roadmap 2.6)
        // --------------------------------------------------------------
        $this->forge->addField([
            'id'            => ['type' => 'INTEGER', 'auto_increment' => true],
            'filename'      => ['type' => 'TEXT', 'null' => false],
            'original_name' => ['type' => 'TEXT', 'null' => false],
            'mime'          => ['type' => 'TEXT', 'null' => false],
            'size'          => ['type' => 'INTEGER', 'null' => false, 'default' => 0],
            'path'          => ['type' => 'TEXT', 'null' => false],
            'thumb_path'    => ['type' => 'TEXT', 'null' => true],
            'created_at'    => ['type' => 'DATETIME', 'null' => true, 'default' => new RawSql('CURRENT_TIMESTAMP')],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('media', true);
    }

    public function down(): void
    {
        // Drop in reverse dependency order.
        $this->forge->dropTable('media', true);
        $this->forge->dropTable('contents', true);
        $this->forge->dropTable('fields', true);
        $this->forge->dropTable('content_types', true);
        $this->forge->dropTable('users', true);
    }
}

