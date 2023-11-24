<?php

/**
 * @wordpress-plugin
 * Plugin Name:         Yabe Open Source - Bricks Floating Panel
 * Plugin URI:          https://os.yabe.land
 * Description:         Bricks builder editor: Floating side panel.
 * Version:             1.0.0-DEV
 * Requires at least:   6.0
 * Requires PHP:        7.4
 * Author:              Rosua
 * Author URI:          https://rosua.org
 * Donate link:         https://ko-fi.com/Q5Q75XSF7
 * Text Domain:         yabe-open-source-brx-floating-panel
 * Domain Path:         /languages
 *
 * @package             Yabe Open Source
 * @author              Joshua Gugun Siagian <suabahasa@gmail.com>
 */

/*
 * This file is part of the Yabe Open Source package.
 *
 * (c) Joshua <suabahasa@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare(strict_types=1);

add_action('wp_enqueue_scripts', 'yos_brx_floating_panel', 1_000_001);

function yos_brx_floating_panel()
{
    if (!function_exists('bricks_is_builder_main') || !bricks_is_builder_main()) {
        return;
    }

    add_filter('script_loader_tag', function ($tag, $handle) {
        if ('yos-brx-floating-panel' !== $handle) {
            return $tag;
        }

        return str_replace(' src', ' type="module" defer src', $tag);
    }, 1_000_001, 2);

    wp_enqueue_style(
        'yos-brx-floating-panel-module-windbox',
        'https://esm.sh/winbox@0.2.6/dist/css/winbox.min.css',
        [],
        null
    );
    wp_enqueue_style(
        'yos-brx-floating-panel',
        plugins_url('style.css', __FILE__),
        [],
        (string) filemtime(__DIR__ . '/style.css')
    );

    wp_enqueue_script(
        'yos-brx-floating-panel',
        plugins_url('builder.js', __FILE__),
        ['wp-hooks', 'bricks-builder',],
        (string) filemtime(__DIR__ . '/builder.js'),
        true
    );
}
