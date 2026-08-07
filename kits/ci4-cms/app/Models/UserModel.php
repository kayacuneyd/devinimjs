<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * users table (roadmap 2.2).
 *
 * DESIGN DECISION — password hashing lives here, not in the controller:
 * the beforeInsert/beforeUpdate callbacks hash any plain-text `password`
 * value with password_hash() (PASSWORD_DEFAULT) exactly once, so every
 * code path (API, seeds, future CLI tooling) is safe by default and no
 * caller can forget. Values that are already password_hash() output are
 * detected via password_get_info() and left untouched.
 */
class UserModel extends Model
{
    protected $table         = 'users';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['name', 'email', 'password'];

    // created_at / updated_at managed automatically (roadmap 2.3 schema).
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $beforeInsert = ['hashPassword'];
    protected $beforeUpdate = ['hashPassword'];

    /**
     * Hash a plain-text password before it touches the database.
     *
     * @param array<string, mixed> $event
     * @return array<string, mixed>
     */
    protected function hashPassword(array $event): array
    {
        if (! isset($event['data']['password']) || ! is_string($event['data']['password'])) {
            return $event;
        }

        $password = $event['data']['password'];
        if ($password !== '' && password_get_info($password)['algo'] === null) {
            $event['data']['password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        return $event;
    }

    /**
     * Look a user up by email (used by AuthController::login()).
     *
     * @return array<string, mixed>|null
     */
    public function findByEmail(string $email): ?array
    {
        /** @var array<string, mixed>|null */
        return $this->where('email', $email)->first();
    }
}
