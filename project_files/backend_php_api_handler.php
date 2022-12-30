<?php

class APIHandler {
    public static function success($output) {
        $totalOutput = array(
            "success" => true,
            "data" => $output,
        );
        print json_encode($totalOutput);
        exit(0);
    }

    public static function failure($error) {
        $totalOutput = array(
            "success" => false,
            "error" => $error,
        );
        print json_encode($totalOutput);
        exit(0);
    }
}

?>