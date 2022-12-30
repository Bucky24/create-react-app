<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
// remove prepended slash
$action = $_REQUEST['action'];

$file = __DIR__ . "/actions/" . $action . ".php";

if (!file_exists($file)) {
    http_response_code(404);
    print "No file for action $action";
    exit(0);
}

require_once($file);

// classname is probably capital for first letter, while api is lowercase
$className = ucfirst($action);

if (!class_exists($className)) {
    http_response_code(404);
    print "Unknown action $className";
    exit(0);
}

$className::handle($_REQUEST);
?>