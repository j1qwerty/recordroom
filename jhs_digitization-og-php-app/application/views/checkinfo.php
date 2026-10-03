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
 form div  p{
	 margin:0px auto;
	 text-align:center;
	 color:red;
 }
  .error{
	 color:red;
	 font-weight:bold;
	 
 }

 .login_content h1:before, .login_content h1:after {
    background: none !important;
}

#content form .submit, .login_content form input[type=submit] {

    margin-left: 80px !important;
}
</style>
    <title>DRM :: Employee Management</title>

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
        <div class="animate form login_form">
          <section class="login_content">
		    <div class="error"><?php if($this->session->flashdata("error")!='')
		  {
			  echo $this->session->flashdata("error");
			  
		  }?></div>
		 
            <form action="<?php echo base_url();?>user/get_details" method="post">
              <label>Registered Users: Enter your Mobile No. to view your records</label>
              <div>
                <input type="text" class="form-control" name="empcode" placeholder="Mobile No." />
				<?php echo form_error('empcode'); ?>
              </div>
              
              <div>
              <input type="submit" class="form-control btn btn-primary submit" style="width:50%" value="Go">
                
              </div>

              <div class="clearfix"></div>

              
            </form>
          </section>
        </div>

        
      </div>
    </div>
  </body>
</html>
