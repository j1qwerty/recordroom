<?php

/**
 * Description of class_db
 *
 * @Sri Technocrat
 */
date_default_timezone_set("Asia/Kolkata");

class class_settings {
    /*     * *******database connection****** */
    
    public $dbserver = 'localhost'; //
    public $dbname = 'hashtag1_MRUPAY-PROD'; //
     public $dbuser = 'hashtag1_apidev'; //
    public $dbpassword = 'S!?t!p}ptM^W'; //
    
    public $connect = null;
    public $db = null;
    public $siteurl = 'http://www.hashtaglabs.in/mrupayapi';
    public $imageurl = 'http://www.hashtaglabs.in/mrupay/uploads/';
public $con_imageurl = "http://hashtaglabs.in/mrupay/uploads/Consumer/";
    public $sp_imageurl = "http://hashtaglabs.in/mrupay/service_engineers_image/";
    public $mob_imageurl = "http://hashtaglabs.in/mrupay/uploads/mobile_icon/";
    public $siteadmin = "";

    
    public function getAdminEmail() {
        return $this->siteadmin;
    }
    public function getSiteUrl() {
        return $this->siteurl;
    }
    
    public function getImageUrl() {
        return $this->imageurl;
    }

public function getConImageUrl() {
        return $this->con_imageurl;
    }

    public function getSPImageUrl() {
        return $this->sp_imageurl;
    }

    public function getMobImageUrl() {
        return $this->mob_imageurl;
    }

    public function MyConnectDB() {
        $this->connect = mysqli_connect($this->dbserver, $this->dbuser, $this->dbpassword, $this->dbname);
        return $this->connect;
    }

    public function MyDisConnectDB() {
        mysqli_close($this->connect);
    }

}

?>