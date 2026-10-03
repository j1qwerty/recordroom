<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!-- Meta, title, CSS, favicons, etc. -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

<style>
.error{
  
  color:red;
  text-align:center;
  
}

</style>
    <title>DRM :: Employee Management :: Forgot Password</title>

    <!-- Bootstrap -->
    <link href="<?php echo base_url();?>vendors/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="<?php echo base_url();?>vendors/font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <!-- NProgress -->
    <link href="<?php echo base_url();?>vendors/nprogress/nprogress.css" rel="stylesheet">
    <!-- Animate.css -->
    <link href="<?php echo base_url();?>vendors/animate.css/animate.min.css" rel="stylesheet">

    <!-- Custom Theme Style -->
    <link href="<?php echo base_url();?>css/custom.min.css" rel="stylesheet">
  </head>

  <body class="login">
    <div>
      <a class="hiddenanchor" id="signup"></a>
      <a class="hiddenanchor" id="signin"></a>
		
		<div class="login_wrapper">
        <div class="animate form login_form" style="border:2px solid blue;border-radius:8px;">
		<div class="col-md-12" style="background-color:#999;padding:8px;" ><img src="<?php echo base_url();?>images/logo.png" class="center-block" /></div>
          <div style="padding:8px;">
		  
		  <section class="login_content">
        <div class="error"><?php if($this->session->flashdata("error")!='')
      {
        echo $this->session->flashdata("error");
        
      }?></div>

		  <?php echo validation_errors(); ?>
            <form action="<?php echo base_url();?>user/recoverpassword" method="post">
              <div class="col-md-12">&nbsp;</div>
			  <h1>Forgot Password</h1>
              <div>
                <input type="text" class="form-control" placeholder="Enter your registered mobile no" name="mobile" />
              </div>
             
              <div>
			  <div class="col-md-12" style="padding:0px;">
			  
              <input type="submit" class="btn btn-info btn-block" value="Submit" style="margin-left:0px;">
                
              </div>
              
                
              </div>

              <div class="clearfix"></div>

              
            </form>
          </section>
        <div>
		</div>

        
      </div>
    </div>
		
    </div>
  </body>
</html>
