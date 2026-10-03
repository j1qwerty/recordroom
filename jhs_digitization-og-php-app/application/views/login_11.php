<!DOCTYPE html>
<html lang="en">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!-- Meta, title, CSS, favicons, etc. -->
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>JHS Digitization</title>

        <!-- Bootstrap -->
        <link href="<?php echo base_url(); ?>vendors/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
        <!-- Font Awesome -->
        <link href="<?php echo base_url(); ?>vendors/font-awesome/css/font-awesome.min.css" rel="stylesheet">
        <!-- NProgress -->
        <link href="<?php echo base_url(); ?>vendors/nprogress/nprogress.css" rel="stylesheet">
        <!-- Animate.css -->
        <link href="<?php echo base_url(); ?>vendors/animate.css/animate.min.css" rel="stylesheet">
        <script src="<?php echo base_url(); ?>vendors/jquery/dist/jquery.min.js"></script>
        <script src="<?php echo base_url(); ?>vendors/bootstrap/dist/js/bootstrap.min.js"></script>
        <!-- Custom Theme Style -->
        <link href="<?php echo base_url(); ?>css/custom.min.css" rel="stylesheet">
    </head>
    <style>
        .error{

            color:red;
            text-align:center;

        }
        form div  p{
            margin:0px auto;
            text-align:center;
            color:red;
        }
        .error{
            color:red;
            font-weight:bold;	 
        }

        .container {

            width: 1170px;

        }
        .header {
            background: #2A3F54;
            height: 60px;
            box-shadow: 0 4px 4px -6px black;
        }
        .headingsec img {
            color: #fff;
            margin: 0;
            padding: 8px 0;
            line-height: 50px;
            font-weight: 600;
        }

        .headingsec h3 {
            color: #fff;
            margin: 0;
            padding: 5px 0;
            line-height: 50px;
            font-weight: 600;
        }
        .slider-section {
            margin: 0 0 45px;
            position: relative;
            width: 70%;
            float: left;
        }
        .login-fomr {
            width: 30%;
            float: left;
            background: #fff;
            position: relative;
            //border-bottom: 2px solid #2a3f54;
        }
        .inner {
            text-align: center;
        }

        .small-box {
            height:130px;
            display: table-cell;
            vertical-align: middle;
        }
        .small-box{border-radius:2px;position:relative;display:block;margin-bottom:20px;box-shadow:0 1px 1px rgba(0,0,0,0.1)}.small-box>.inner{padding:10px}.small-box>.small-box-footer{position:relative;text-align:center;padding:3px 0;color:#fff;color:rgba(255,255,255,0.8);display:block;z-index:10;background:rgba(0,0,0,0.1);text-decoration:none}.small-box>.small-box-footer:hover{color:#fff;background:rgba(0,0,0,0.15)}.small-box h3{font-size:38px;font-weight:bold;margin:0 0 10px 0;white-space:nowrap;padding:0}.small-box p{font-size:15px}.small-box p>small{display:block;color:#f9f9f9;font-size:13px;margin-top:5px}.small-box h3,.small-box p{z-index:5px}.small-box .icon{-webkit-transition:all .3s linear;-o-transition:all .3s linear;transition:all .3s linear;position:absolute;top:-10px;right:10px;z-index:0;font-size:90px;color:rgba(0,0,0,0.15)}.small-box:hover{text-decoration:none;color:#f9f9f9}.small-box:hover .icon{font-size:95px}@media (max-width:767px){.small-box{text-align:center}.small-box .icon{display:none}.small-box p{font-size:12px}}


    </style>
    <body class="login">
        <div class="header">
            <div class="container">
                <div class="row">
                    <div class="col-md-3">
                        <div class="headingsec"><img src="<?php echo base_url(); ?>images/logo.png" alt="..."> <!--<h3>STC CHARBAGH</h3>--></div>
                    </div>
                    <div class="col-md-6">
                        <div class="headingsec"><h3 style="text-align:center;">JHS Digitization</h3></div>
                    </div>
                    <div class="col-md-3">
                        <div><h3 style="color:#fff; font-size: 15px; float:right;">Website Working Hours:<br>10:30AM to 5:30PM (Monday-Friday)</h3></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="slider-formlo">
            <div class="slider-section">
                <div id="myCarousel" class="carousel slide" data-ride="carousel">

                    <!-- Wrapper for slides -->
                    <div class="carousel-inner">
                        <?php for ($j = 1; $j <= 3; $j++) { ?>

                            <div class="item <?php
                            if ($j == 1) {
                                echo 'active';
                            }
                            ?>">
                                  <!-- <img src="la.jpg" alt="Los Angeles" style="width:100%;"> -->
                                <img style="width:100%; height:350px;" src="<?php echo base_url(); ?>images/banner<?php echo $j; ?>.jpg" alt=""/>

                            </div>
                        <?php } ?>
                    </div>

                    <!-- Left and right controls -->
                    <a class="left carousel-control" href="#myCarousel" data-slide="prev">
                        <span class="glyphicon glyphicon-chevron-left"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a class="right carousel-control" href="#myCarousel" data-slide="next">
                        <span class="glyphicon glyphicon-chevron-right"></span>
                        <span class="sr-only">Next</span>
                    </a>
                </div>

            </div>

            <a class="hiddenanchor" id="signup"></a>
            <a class="hiddenanchor" id="signin"></a>

            <div class="login-fomr">
                <div class="animate form login_form">
                    <!--<div class="col-md-12" style="background-color:#999;padding:8px;"></div>-->
                    <div style="padding:8px;">
                        <div class="error" style="margin-top:8px;">
                            <?php
                            if ($this->session->flashdata("error") != '') {
                                echo $this->session->flashdata("error");
                            }
                            ?></div>
                        <section class="login_content">	    

                            <form action="<?php echo base_url(); ?>user/login_process" method="post">
                                <div class="col-md-12">&nbsp;</div>
                                <h1>Admin Login</h1>
                                <div>
                                    <input type="text" class="form-control" placeholder="Username" name="username" />
                                    <?php echo form_error('username'); ?>
                                </div>
                                <div>
                                    <input type="password" class="form-control" placeholder="Password" name="password"/>
                                    <?php echo form_error('password'); ?>
                                </div>
                                <div class="col-md-12">&nbsp;</div>
                                <div class="col-md-12" style="padding:0px;">
                                    <input type="submit" class="btn btn-info btn-block" value="Login" style="margin-left:0px;">
                                </div>
                                <div class="col-md-12">&nbsp;</div>
                                <div class="col-md-12 text-right">
                                    <a href="<?php echo base_url(); ?>user/forgotpassword">Forgot Password?</a>
                                </div>
                            </form>
                        </section>
                        <div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="container" style="clear:both;">          
            <div class="row">

                <div class="col-lg-2 col-xs-6">
                    <!-- small box -->
                    <div class="small-box bg-blue">
                        <div class="inner">
                            <h3><?php echo $this->User_model->file_count()->mycount; ?></h3>
                            <p>File</p>
                        </div>
                        <div class="icon">
                            <i class="ion ion-bag"></i>
                        </div>
                        <!--<a href="#" class="small-box-footer">VIEW <i class="fa fa-arrow-circle-right"></i></a> -->
                    </div>
                </div><!-- ./col -->
                <div class="col-lg-2 col-xs-6">
                    <!-- small box -->

                    <div class="small-box bg-red">
                        <div class="inner">
                            <h3><?php echo $this->User_model->file_record_count()->mycount; ?></h3>
                            <p>File Record</p>
                        </div>
                        <div class="icon">
                            <i class="ion ion-stats-bars"></i>
                        </div>
                    </div>

                </div><!-- ./col -->
                <div class="col-lg-2 col-xs-6">
                    <!-- small box -->

                    <div class="small-box bg-purple">
                        <div class="inner">
                            <h3><?php echo $this->User_model->map_count()->mycount; ?></h3>
                            <p>Map</p>
                        </div>
                        <div class="icon">
                            <i class="ion ion-person-add"></i>
                        </div>
                    </div>

                </div><!-- ./col -->
                <!--<div class="col-lg-2 col-xs-6">
                <!-- small box
               
                <div class="small-box bg-green">
                  <div class="inner">
                    <h3><?php echo $this->User_model->sr_attachment_count()->mycount; ?></h3>
                    <p>SR Attachment</p>
                  </div>
                  <div class="icon">
                    <i class="ion ion-pie-graph"></i>
                  </div>
                </div>
              </div> -->
                <div class="col-lg-2 col-xs-6">
                    <!-- small box -->

                    <div class="small-box bg-orange">
                        <div class="inner">
                            <h3><?php echo $this->User_model->apar_count()->mycount; ?></h3>
                            <p>APAR</p>
                        </div>
                        <div class="icon">
                            <i class="ion ion-pie-graph"></i>
                        </div>
                    </div>

                </div>

                <div class="col-lg-2 col-xs-6">
                    <!-- small box -->

                    <div class="small-box bg-blue-sky">
                        <div class="inner">
                            <h5 style="margin-top: 5px;"><strong style="font-size:16px; text-decoration: underline;">For Employees</strong><br><br>Download Mobile App From Here...<br><a href="https://play.google.com/store/apps/details?id=biz.hashtaglabs.lkonr" class="btn btn-danger">Download</a></h5>
                        </div>

                    </div>

                </div>
                <!-- ./col -->
            </div>

        </div>

        <footer style="margin:48px 0 0 0;">
            <div class="row">
                <?php echo date('Y'); ?> © JHS Digitization | Powered By  <a class="site-namehere" href="http://hashtaglabs.biz/">#HashTag Labs.</a>
            </div>
            <div class="clearfix"></div>
        </footer> 




    </body>
</html>
