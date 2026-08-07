<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Libraries\PluginLoader;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\CLIRequest;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;

/**
 * Class BaseController
 *
 * BaseController provides a convenient place for loading components
 * and performing functions that are needed by all your controllers.
 * Extend this class in any new controllers:
 *     class Home extends BaseController
 *
 * For security be sure to declare any new methods as protected or private.
 */
abstract class BaseController extends Controller
{
    /**
     * Instance of the main Request object.
     *
     * @var CLIRequest|IncomingRequest
     */
    protected $request;

    /**
     * An array of helpers to be loaded automatically upon class instantiation.
     * These helpers will be available to all other controllers that extend
     * BaseController.
     *
     * - 'url'  gives base_url()/site_url() to controllers and views
     * - 'text' gives url_title() for slug generation (roadmap 2.4)
     *
     * @var list<string>
     */
    protected $helpers = ['url', 'text'];

    /**
     * Be sure to declare properties for any property fetch you initialized.
     * The creation of dynamic property is deprecated in PHP 8.2.
     */
    // protected $session;

    /**
     * @return void
     */
    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger)
    {
        // Do Not Edit This Line
        parent::initController($request, $response, $logger);

        // Preload & Secure session
        // $this->session = service('session');

        // Boot the plugin system (roadmap 2.5): registers every active
        // plugin's Config/Hooks.php listeners and plugin.json `events`.
        // Idempotent — runs once per request no matter how many
        // controllers are instantiated. Plugin *routes* are registered
        // separately in app/Config/Routes.php.
        PluginLoader::boot();
    }
}
