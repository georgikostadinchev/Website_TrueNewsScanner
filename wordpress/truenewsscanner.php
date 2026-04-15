<?php
/**
 * Plugin Name: TrueNewsScanner
 * Plugin URI: https://truenewsscannerapp.replit.app
 * Description: Вграден скенер за измами и дезинформация на български. Използвайте shortcode [truenewsscanner] за вграждане.
 * Version: 1.0.0
 * Author: TrueNewsScanner
 * License: GPL v2 or later
 * Text Domain: truenewsscanner
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'TNS_VERSION', '1.0.0' );
define( 'TNS_DEFAULT_URL', 'https://truenewsscannerapp.replit.app' );

/**
 * Register the shortcode [truenewsscanner]
 *
 * Usage examples:
 *   [truenewsscanner]
 *   [truenewsscanner height="700" url="https://your-custom-url.replit.app"]
 *   [truenewsscanner tab="message"]
 */
function tns_shortcode( $atts ) {
    $atts = shortcode_atts(
        array(
            'url'    => get_option( 'tns_app_url', TNS_DEFAULT_URL ),
            'height' => get_option( 'tns_height', '680' ),
            'tab'    => '',
            'border' => '0',
            'radius' => '12',
        ),
        $atts,
        'truenewsscanner'
    );

    $url = esc_url( trailingslashit( $atts['url'] ) );
    if ( ! empty( $atts['tab'] ) ) {
        $url .= '?tab=' . esc_attr( $atts['tab'] );
    }

    $height = absint( $atts['height'] );
    $radius = absint( $atts['radius'] );

    $style = sprintf(
        'width:100%%;height:%dpx;border:none;border-radius:%dpx;box-shadow:0 4px 24px rgba(0,0,0,0.10);display:block;',
        $height,
        $radius
    );

    return sprintf(
        '<div class="truenewsscanner-embed" style="width:100%%;overflow:hidden;border-radius:%dpx;">'
        . '<iframe src="%s" style="%s" loading="lazy" title="TrueNewsScanner — Проверка за измами и дезинформация" allowfullscreen></iframe>'
        . '</div>',
        $radius,
        $url,
        $style
    );
}
add_shortcode( 'truenewsscanner', 'tns_shortcode' );

/**
 * Register admin settings page
 */
function tns_admin_menu() {
    add_options_page(
        'TrueNewsScanner Настройки',
        'TrueNewsScanner',
        'manage_options',
        'truenewsscanner',
        'tns_settings_page'
    );
}
add_action( 'admin_menu', 'tns_admin_menu' );

function tns_settings_init() {
    register_setting( 'tns_settings', 'tns_app_url', array(
        'type'              => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'default'           => TNS_DEFAULT_URL,
    ) );
    register_setting( 'tns_settings', 'tns_height', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 680,
    ) );

    add_settings_section(
        'tns_main',
        'Настройки на TrueNewsScanner',
        '__return_null',
        'truenewsscanner'
    );

    add_settings_field(
        'tns_app_url',
        'URL на приложението',
        'tns_field_url',
        'truenewsscanner',
        'tns_main'
    );

    add_settings_field(
        'tns_height',
        'Височина (px)',
        'tns_field_height',
        'truenewsscanner',
        'tns_main'
    );
}
add_action( 'admin_init', 'tns_settings_init' );

function tns_field_url() {
    $val = get_option( 'tns_app_url', TNS_DEFAULT_URL );
    echo '<input type="url" name="tns_app_url" value="' . esc_attr( $val ) . '" class="regular-text" />';
    echo '<p class="description">URL адресът на вашето TrueNewsScanner приложение.</p>';
}

function tns_field_height() {
    $val = get_option( 'tns_height', 680 );
    echo '<input type="number" name="tns_height" value="' . esc_attr( $val ) . '" min="400" max="1200" class="small-text" /> px';
    echo '<p class="description">Препоръчителна стойност: 680px.</p>';
}

function tns_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;
    ?>
    <div class="wrap">
        <h1>TrueNewsScanner</h1>
        <p>Вградете TrueNewsScanner на всяка страница чрез shortcode:</p>
        <code style="font-size:15px;background:#f0f0f0;padding:8px 12px;border-radius:4px;display:inline-block;">[truenewsscanner]</code>
        <br><br>
        <p>Допълнителни параметри:</p>
        <ul style="list-style:disc;margin-left:20px;">
            <li><code>[truenewsscanner height="800"]</code> — задайте конкретна височина в пиксели</li>
            <li><code>[truenewsscanner tab="message"]</code> — отворете конкретен таб (url, phone, message, news)</li>
            <li><code>[truenewsscanner url="https://your-url.replit.app"]</code> — използвайте различен URL</li>
        </ul>
        <hr>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'tns_settings' );
            do_settings_sections( 'truenewsscanner' );
            submit_button( 'Запази настройките' );
            ?>
        </form>
    </div>
    <?php
}
