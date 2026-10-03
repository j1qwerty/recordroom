<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of class_basic
 *
 * @author srishti
 */
include_once 'class_db.php';
class class_basic {
    //put your code here
    
    public $state;
    public function SState() {
        $ObjDB = new class_db();
        $S = "SELECT * FROM mrupaystate ORDER BY state_name ASC";
        $ObjDB->sproc_name = $S;
        $R = $ObjDB->SelectQuery();
        return $R;
    }
    
    public function SCity() {
        $ObjDB = new class_db();
        $S = "SELECT * FROM mrupaycity WHERE state_id = '".$this->state."' ORDER BY city_name ASC";
        $ObjDB->sproc_name = $S;
        $R = $ObjDB->SelectQuery();
        return $R;
    }
}
