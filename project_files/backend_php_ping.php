<?php

require_once(__DIR__ . "/../api_handler.php");

class Ping extends APIHandler {
    public static function handle($params) {
        self::success("pong");
    }
}

?>