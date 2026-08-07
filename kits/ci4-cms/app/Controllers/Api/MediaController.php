<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Models\MediaModel;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * /api/media — media library (roadmap 2.6).
 *
 * Uploads land in writable/uploads with a random name; a 300×300 GD
 * thumbnail is generated next to it under writable/uploads/thumbs.
 * Rows are tracked in the `media` table.
 *
 * Serving note: writable/ is outside the web root by design. Either
 * symlink public/uploads → ../writable/uploads (see kit README) or move
 * the upload target into public/ if your host forbids symlinks.
 */
class MediaController extends BaseApiController
{
    protected MediaModel $mediaModel;

    public function __construct()
    {
        $this->mediaModel = new MediaModel();
    }

    /**
     * GET / — paginated list, newest first. Query: page, limit, q (filename).
     */
    public function index(): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $page  = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = (int) ($this->request->getGet('limit') ?? 24);
        $limit = $limit < 1 ? 24 : min(100, $limit);

        $query = $this->mediaModel;
        $term  = trim((string) ($this->request->getGet('q') ?? ''));
        if ($term !== '') {
            $query = $query->groupStart()
                ->like('filename', $term)
                ->orLike('original_name', $term)
                ->groupEnd();
        }

        $total = $query->countAllResults(false);
        $rows  = $query->orderBy('id', 'DESC')->findAll($limit, ($page - 1) * $limit);

        return $this->ok($rows, ['page' => $page, 'limit' => $limit, 'total' => $total]);
    }

    /**
     * GET /{id}
     *
     * @param int|string|null $id
     */
    public function show($id = null): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $row = is_numeric($id) ? $this->mediaModel->find((int) $id) : null;

        return $row === null
            ? $this->failNotFound('Media not found: ' . $id)
            : $this->ok($row);
    }

    /**
     * POST /upload — multipart form field `image` (roadmap 2.6).
     *
     * Responds { id, url, thumb_url } on success — the exact shape the
     * <dv-media-upload> component forwards in its `dv:uploaded` event.
     */
    public function upload(): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $file = $this->request->getFile('image');

        if ($file === null || ! $file->isValid()) {
            return $this->failValidationErrors(['image' => 'Geçersiz veya eksik dosya.']);
        }

        $rules = [
            'image' => 'uploaded[image]|max_size[image,5120]|ext_in[image,png,jpg,jpeg,gif,webp]',
        ];

        if (! $this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $uploadDir = WRITEPATH . 'uploads';
        $thumbDir  = $uploadDir . DIRECTORY_SEPARATOR . 'thumbs';
        foreach ([$uploadDir, $thumbDir] as $dir) {
            if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
                return $this->fail('Upload directory is not writable: ' . $dir, 500);
            }
        }

        // Capture client metadata BEFORE move() — afterwards the temp file
        // is gone and some readers (e.g. mime detection) can no longer run.
        $originalName = $file->getClientName();
        $mime         = $file->getClientMimeType();
        $size         = $file->getSize();
        $newName      = $file->getRandomName();

        $file->move($uploadDir, $newName);

        // 300×300 center-fit thumbnail via GD (roadmap 2.6). Failure is
        // non-fatal: fall back to serving the original as its own thumb.
        $thumbPath = '/uploads/thumbs/' . $newName;
        try {
            Services::image()
                ->withFile($uploadDir . DIRECTORY_SEPARATOR . $newName)
                ->fit(300, 300, 'center')
                ->save($thumbDir . DIRECTORY_SEPARATOR . $newName);
        } catch (\Throwable $exception) {
            log_message('error', '[ci4-cms] Thumbnail failed for {file}: {message}', [
                'file'    => $newName,
                'message' => $exception->getMessage(),
            ]);
            $thumbPath = '/uploads/' . $newName;
        }

        $mediaId = $this->mediaModel->insert([
            'filename'      => $newName,
            'original_name' => $originalName,
            'mime'          => $mime,
            'size'          => $size,
            'path'          => '/uploads/' . $newName,
            'thumb_path'    => $thumbPath,
        ], true);

        if ($mediaId === false) {
            return $this->failValidationErrors($this->mediaModel->errors());
        }

        return $this->respond([
            'id'        => $mediaId,
            'url'       => base_url('/uploads/' . $newName),
            'thumb_url' => base_url($thumbPath),
        ], 201);
    }


    /**
     * DELETE /{id} — remove the row and both files (original + thumb).
     *
     * @param int|string|null $id
     */
    public function delete($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $row = is_numeric($id) ? $this->mediaModel->find((int) $id) : null;
        if ($row === null) {
            return $this->failNotFound('Media not found: ' . $id);
        }

        foreach (['path', 'thumb_path'] as $key) {
            $relative = ltrim((string) ($row[$key] ?? ''), '/'); // e.g. "uploads/xyz.png"
            if ($relative !== '' && str_starts_with($relative, 'uploads/')) {
                $absolute = WRITEPATH . str_replace('/', DIRECTORY_SEPARATOR, $relative);
                if (is_file($absolute)) {
                    @unlink($absolute);
                }
            }
        }

        $this->mediaModel->delete((int) $row['id']);

        return $this->ok(['id' => (int) $row['id'], 'deleted' => true]);
    }
}

