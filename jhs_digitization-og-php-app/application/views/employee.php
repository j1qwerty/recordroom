 <style>
 .labeltext{
	font-weight:bold 
	 
 }
 .error{
	 color:red;
	 font-weight:bold;
	 
 }
 .item  p{
	 margin:0px;
	 color:red;
 }
 .form-control {
    border-radius: 0;
    width: 100%;
    margin-bottom: initial !important;
}
.falanae .item.form-group {
    float: left;
    width: 33.3%;
    padding: 0 15px;
    min-height: 80px;
    margin: 0;
}

#duplicatecheck{
	coplor:red;
	font-weight:bold;
	display:none;
	
	
}
.form-group .btn {
    margin-bottom: -60px;
}
 </style>

 <div class="right_col">
          <div class="" ng-show="employee_frm">
            <div class="page-title">
              <div class="title_left">
                <h3>Employee Details</h3>
              </div>

         
            </div>
            <div class="clearfix"></div>

            <div class="row">
			
              <div class="col-md-12 col-sm-12 col-xs-12">
			  
                <div class="x_panel">
                  <div class="x_title">
                    <h2>Personal Information</h2>
                    <ul class="nav navbar-right panel_toolbox">
                      <li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a>
                      </li>                      
                    </ul>
                    <div class="clearfix"></div>
                  </div>
                  <div class="x_content"><div class="error" style="text-align:center"><?php 
				  if($this->session->flashdata("error")!='')
				  {
					  echo $this->session->flashdata("error");
					  
				  }
				  
				  
				  
				  ?></div>
                    <form class="falanae" action="<?php echo base_url();?>user/make_employee" name="employeeform" method="post">               
                      
                      <div class="col-md-12" style="padding-left:25px;">
                    	 <div class="item">
                        
                        <label for="Role">Role</label>
							<div>
								<!-- <label class="radio-inline">
								<input type="radio" name="role" value="1">Supervisor
								</label>
								<label class="radio-inline">
								<input type="radio" name="role" value="2">Operator
								</label>
								<label class="radio-inline">
								<input type="radio" name="role" value="4">Verifier
								</label> -->
								<label class="radio-inline">
								<input type="radio" name="role" value="3" checked>Employee 
								</label>
								 <?php echo form_error('role'); ?>
							</div>
                        
                      </div>
                  </div>
                  <div class="col-md-12">&nbsp;</div>
                  <div class="col-md-12" >
                      <div class="item form-group">
                                          
                        
						<label for="prefix">Employee Code <span style="color:red">*</span></label>
                          <input id="employee_code" class="form-control"  name="employee_code" placeholder="Enter employee code"  type="text" value="<?php echo set_value('employee_code'); ?>">
						  <?php echo form_error('employee_code'); ?>
                            <p id="duplicatecheck">This employee code already exists! </p>
                      </div>

                      <div class="item form-group">

						<label for="prefix">Prefix</label>
                          <select name="prefix" class="form-control" View Next Level>
						   <option value="Mr.">Mr.</option>
						   <option value="Mrs.">Mrs.</option>
						  
						  </select>
						   <?php echo form_error('prefix'); ?>
                        
                      </div>
                      
                      <div class="item form-group">
                        
						<label for="employee">Employee Name <span style="color:red">*</span></label>
                          <input id="employee_name" class="form-control"  value="<?php echo set_value('employee_name'); ?>" name="employee_name" placeholder="Enter employee name"  type="text">
						  <?php echo form_error('employee_name'); ?>
						 
                        </div>

                        <div class="item form-group">
                        
                        
						<label for="fathername">Father's Name</label>
                          <input type="text" id="fathername" name="fathername" placeholder="Enter Father's Name"  class="form-control col-md-7 col-xs-12" value="<?php echo set_value('fathername'); ?>" >
                        
                      </div>

                        <div class="item form-group">
                        
                        
						<label for="prefix">File Code</label>
                          <input id="employee_code" class="form-control"  name="file_code" placeholder="Enter file code"  type="text" value="<?php echo set_value('file_code'); ?>">
						  <?php echo form_error('file_code'); ?>
                            
                      </div>
                      
                      <div class="item form-group">
                       
                        
						<label for="gender">Gender</label>
                          <select name="gender"  class="form-control">
						  <option value="Male">Male</option>
						  <option value="Female">Female</option>
						  </select>
						  <?php echo form_error('gender'); ?>
                        
                      </div>
                     <div class="item form-group">
                        
                       
						<label for="dateofb">Date of Birth <span style="color:red">*</span></label>
                          <input type="date" id="dob" name="dob"  value="<?php echo set_value('dob'); ?>"   placeholder="Select Date" class="form-control">
						   <?php echo form_error('dob'); ?>
                       
                      </div>
                      <div class="item form-group">
                        
                        
						<label for="email">Email Id</label>
                          <input type="email" id="email" name="email"  value="<?php echo set_value('email'); ?>"  placeholder="Enter Email"  class="form-control">
						   <?php echo form_error('email'); ?>
					
                      </div>
                             
						 <div class="item form-group">
                       
                        
						<label for="mobileno">Mobile No</label>
                          <input type="text" id="mobile" name="mobile" maxlength="10" placeholder="Enter 10 digit mobile no"  class="form-control"  onkeypress="return isNumber(event)" value="<?php echo set_value('mobile'); ?>" >
						   <?php echo form_error('mobile'); ?>
                        
                      </div>

                      <div class="item form-group">
                       
						<label for="dept">Department <span style="color:red">*</span></label>
                          <select id="dept" name="dept" class="form-control">
                          	<option value="">-Select-</option>
						   <?php foreach($this->User_model->getdepartments() as $dep)
					               { ?>
								<option value="<?php echo $dep->id; ?>"><?php echo $dep->name;?></option>
								 <?php } ?>
						  </select>
						  <?php echo form_error('dept'); ?>
                        
                      </div>

                       <div class="item form-group">
                       
						<label for="desg">Designation <span style="color:red">*</span></label>
                          <select id="desg" name="desg" class="form-control">
                          	<option value="">-Select-</option>
						  <?php foreach($this->User_model->getdesignations() as $desg)
					               { ?>
								<option value="<?php echo $desg->id; ?>"><?php echo $desg->name;?></option>
								 <?php } ?>
						  </select>
						  <?php echo form_error('desg'); ?>
                        
                      </div>
					  
					   <div class="item form-group">
                        
                        
						<label for="pan">PAN</label>
                          <input type="text" id="pan" name="pan" maxlength="10" placeholder=""  value="<?php echo set_value('pan'); ?>"  class="form-control">
						   <?php echo form_error('pan'); ?>
                        
                      </div>

             <div class="item form-group">
                        
                        
						<label for="aadhar">Aadhar</label>
                          <input type="text" View Next Level id="aadhar" maxlength="12" name="aadhar" placeholder=""  class="form-control col-md-7 col-xs-12"  onkeypress="return isNumber(event)"  value="<?php echo set_value('aadhar'); ?>" >
						   <?php echo form_error('aadhar'); ?>
                        
                      </div>
                     
                      
<div class="ln_solid"></div>
<div class="form-group">
<div class="col-md-6" style="padding-left:17px;">
	<button id="send" type="submit" class="btn btn-success" >Submit</button>
	<button type="reset" class="btn btn-danger">Cancel</button>
	
</div>
<div class="col-md-6">&nbsp;</div>
</div>
</div>
</form>
</div>
                </div>
              </div>
            </div>
          </div>
		  
		  
		  
</div><script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.inputmask/3.1.62/jquery.inputmask.bundle.js"></script>
<script>


function addhyphen(f)
{
     num = f.aadhar.value;
parts = [num.slice(0,3),num.slice(3,6),num.slice(6,10)];
fNum = parts[0]+"-"+parts[1]+"-"+parts[2];
f.aadhar.value=fNum;
      
}

function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}

$(document).ready(function(){
	$("#employee_code").blur(function(){
		var id=$(this).val();
		
		$.post( 
                  "<?php echo base_url()?>user/checkempid",
                  { id: id },
                  function(data) {
					 
					  if(data==1)
					  {
                     $('#duplicatecheck').fadeIn();
					 $("#send").attr("disabled","disabled");
					  }
					  else
					  {
						$('#duplicatecheck').fadeOut();  
						$("#send").attr("disabled",false);
					  }
                  }
               );
		
	});
	
	
});
</script>
		