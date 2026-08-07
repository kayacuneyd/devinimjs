<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Default administrator account (roadmap 6 checklist).
 *
 *   email:    admin@example.com
 *   password: devinim
 *
 * ⚠ CHANGE THIS PASSWORD IMMEDIATELY after first login (or edit the row
 * below before seeding). The credentials are public knowledge — they are
 * documented in the kit README so nobody "forgets" they exist.
 *
 * Idempotent: re-running the seeder does nothing when the row exists.
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'admin@example.com';

        $exists = $this->db->table('users')->where('email', $email)->countAllResults();
        if ($exists > 0) {
            return;
        }

        $this->db->table('users')->insert([
            'name'       => 'Administrator',
            'email'      => $email,
            // Plain hash here (not via UserModel) keeps the seeder usable
            // even before app/ code is copied over a fresh appstarter.
            'password'   => password_hash('devinim', PASSWORD_DEFAULT),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
