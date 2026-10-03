 <style>
 .labeltext{
	font-weight:bold 
	 
 }
 .error{
	 color:red;
	 font-weight:bold;
	 
 }
 .form-group .btn {
    margin-bottom: -50px;
}
 </style>
 <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"></script>
 <div class="right_col" role="main" ng-app="drm_app" ng-controller="drmCtrl">
          <div class="" ng-show="employee_frm">
            <div class="page-title">
              <div class="title_left">
                <h3>Employee Details</h3>
              </div>

         
            </div>
            <div class="clearfix"></div>
<?php
 if($this->session->flashdata('item') != '') {
           $message = $this->session->flashdata('item');
           ?>
 <div class="alert alert-<?php echo $message['class'] ?>"><?php echo $message['message']; 

		
		?> </div>
        <?php
        }?>
            <div class="row">
		<?php // echo '<pre>';print_r($singleemployee);exit;?>	
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
                  <div class="x_content"><div class="error" ng-bind="error" style="text-align:center"></div>
<form method="post" action="<?php echo base_url()?>user/updateemployee" enctype="multipart/form-data">   
    
                      <div class="item form-group">
                        <input type="hidden" name="emp_id" value="<?php if(!empty($singleemployee->emp_id)){ echo $singleemployee->emp_id; }else{ echo '';} ?>">
                         <!--<input type="hidden" name="role" value="<?php // if(!empty($singleemployee->role)){ echo $singleemployee->role; }else{ echo 3;} ?>">-->
                       
                         <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Employee Code</div>
<input  class="form-control col-md-7 col-xs-12" name="employee_code" placeholder="Enter employee code" value="<?php if(!empty($singleemployee->employee_code)){ echo $singleemployee->employee_code; } ?>"  type="text">
                        </div>
                      </div>
                      <div class="item form-group">
                      
                       
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Prefix</div>
 <select name="prefix"  class="form-control col-md-7 col-xs-12"s>
						 
					<option <?php if($singleemployee->prefix=='Mr.'){ echo "selected"; } ?> value="Mr.">Mr.</option>
                    <option <?php if($singleemployee->prefix=='Mrs.'){ echo "selected"; } ?> value="Mrs.">Mrs.</option>
                    <option <?php if($singleemployee->prefix=='Shri'){ echo "selected"; } ?> value="Shri">Shri</option>	  
						  </select>
                        </div>
                      </div>
                      
                      <div class="item form-group">
                        
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Employee Name</div>
                          <input id="employee_name" class="form-control col-md-7 col-xs-12" name="employee_name" placeholder="Enter employee name" value="<?php if(!empty($singleemployee->employee_name)){ echo $singleemployee->employee_name; }?>"  type="text">
                        </div>
                      </div>

                      <div class="item form-group">
                        
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Father's Name</div>
                          <input id="fathername" class="form-control col-md-7 col-xs-12" name="fathername" placeholder="Enter Father's Name" value="<?php if(!empty($singleemployee->fathername)){ echo $singleemployee->fathername; }?>"  type="text">
                        </div>
                      </div>

                         <div class="item form-group">
                        <div class="col-md-4 col-sm-6 col-xs-12">
                        
            <div class="labeltext">File Code</div>
                          <input id="file_code" class="form-control col-md-7 col-xs-12" name="file_code" placeholder="Enter file code"  type="text" value="<?php if(!empty($singleemployee->code)){ echo $singleemployee->code; }?>">
                            </div>
                      </div>

                      <div class="item form-group">
                       
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Gender</div>
                          <select name="gender" class="form-control col-md-7 col-xs-12">
						  <option <?php if($singleemployee->gender=='Male'){ echo "selected"; } ?> value="Male">Male</option>
						  <option <?php if($singleemployee->gender=='Female'){ echo "selected"; } ?> value="Female">Female</option>
						  </select>
                        </div>
                      </div>
                     <div class="item form-group">
                        
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Date of Birth</div>
<input type="date" id="dob" name="dob" value="<?php if(!empty($singleemployee->dob)){ echo $singleemployee->dob; } ?>"  placeholder="Select Date" class="form-control col-md-7 col-xs-12">
                        </div>
                      </div>
                      <div class="item form-group">
                        
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Email Id</div>
<input type="email" id="email" name="email" value="<?php if(!empty($singleemployee->email)){ echo $singleemployee->email; } ?>" placeholder="Enter Email"  class="form-control col-md-7 col-xs-12">
						<span class="error" ng-show="employeeform.email.$error.email">Invalid Email!</span>
                        </div>
                      </div>
                             
						 <div class="item form-group">
                       
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Mobile No</div>
<input type="text" id="mobile" name="mobile" maxlength="10" value="<?php if(!empty($singleemployee->mobile)){ echo $singleemployee->mobile; } ?>" placeholder="Enter 10 digit mobile no"  class="form-control col-md-7 col-xs-12">
						  
                        </div>
                      </div>

              <div class="item form-group">
                    <div class="col-md-4 col-sm-6 col-xs-12">   
            <div class="labeltext">Department</div>
                          <select id="dept" name="dept" class="form-control col-md-7 col-xs-12">
                            <option value="">-Select-</option>
               <?php foreach($this->User_model->getdepartments() as $dep)
                         { ?>
                <option <?php if(!empty($singleemployee->emp_department)){ if($singleemployee->emp_department == $dep->id) { echo "selected"; } } ?> value="<?php echo $dep->id; ?>"><?php echo $dep->name;?></option>
                 <?php } ?>
              </select>
                    </div>
                        
              </div>

                <div class="item form-group">
                      <div class="col-md-4 col-sm-6 col-xs-12"> 
            <div class="labeltext">Designation</div>
                          <select id="desg" name="desg" class="form-control">
                            <option value="">-Select-</option>
              <?php foreach($this->User_model->getdesignations() as $desg)
                         { ?>
                <option <?php if(!empty($singleemployee->emp_designation)){ if($singleemployee->emp_designation == $desg->id) { echo "selected"; } } ?> value="<?php echo $desg->id; ?>"><?php echo $desg->name;?></option>
                 <?php } ?>
              </select>
                    </div>
                        
                </div>
					  
					   <div class="item form-group">
                        
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">PAN</div>
<input type="text" id="pan" name="pan" maxlength="10" value="<?php if(!empty($singleemployee->pan)){ echo $singleemployee->pan; } ?>" placeholder=""  class="form-control col-md-7 col-xs-12">
                        </div>
                      </div>
					  
					   <div class="item form-group">
                        
                        <div class="col-md-4 col-sm-6 col-xs-12">
						<div class="labeltext">Aadhar</div>
<input type="text"  maxlength="12" value="<?php if(!empty($singleemployee->aadhar)){ echo $singleemployee->aadhar; } ?>" name="aadhar" placeholder=""  class="form-control col-md-7 col-xs-12">
                        </div>
                      </div>
		<!--<input type="hidden" value="<?php // echo $this->uri->segment(3); ?>" name="empid" />-->					 
                      
                     
                      
                      <div class="ln_solid"></div>
                      <div class="form-group">
                        <div class="col-md-6">
                          <button type="submit" class="btn btn-success">Update</button>
                          <button type="reset" class="btn btn-danger">Cancel</button>        
                        </div>
                        <div class="col-md-6">&nbsp;</div>
                      </div>
                    </form>
                  </div>
                </div>
                
            
   

              </div>
            </div>
          </div>
		  
		  
		  
		  
		  <div class="" ng-show="doc_frm">
            <div class="page-title">
              <div class="title_left">
                <h3>Employee Documents</h3>
              </div>

         
            </div>
            <div class="clearfix"></div>

            <div class="row">
			
              <div class="col-md-12 col-sm-12 col-xs-12">
			  <div id="error" ng-bind="error"></div>
                <div class="x_panel">
                  <div class="x_title">
                    <h2>Upload Documents</h2>
                    <ul class="nav navbar-right panel_toolbox">
                      <li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a>
                      </li>                      
                    </ul>
                    <div class="clearfix"></div>
                  </div>
                  <div class="x_content">
                    <form class="" name="form"  id="form"  role="form">               
                      <div class="form-group" ng-show="doc1">
                        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="last-name">Service Book <span class="required">*</span>
                        </label>
                        <div class="col-md-6 col-sm-6 col-xs-12">
                          <input type="file" ng-model="form.service" accept="image/*" onchange="angular.element(this).scope().uploadedFile(this)" name="service" id="service" class="form-control col-md-7 col-xs-12">
						   <button id="send" type="button" class="btn btn-success" ng-click="submitdocs()">Upload</button>
                        </div>
						 <div class="col-md-3 col-sm-3 col-xs-12"><img ng-src="{{image_source}}" style="width: auto;   height: 170px;"></div>
                      </div>
					  
					  
					  
					  <div class="form-group"  ng-show="doc2">
                        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="last-name">Leave report <span class="required">*</span>
                        </label>
                        <div class="col-md-6 col-sm-6 col-xs-12">
                          <input type="file" ng-model="form.service2" accept="image/*" onchange="angular.element(this).scope().uploadedFile2(this)" name="lp" id="lp" class="form-control col-md-7 col-xs-12">
						   <button id="send" type="button" class="btn btn-success" ng-click="submitdocs2()">Upload</button>
                        </div>
						 <div class="col-md-3 col-sm-3 col-xs-12"><img ng-src="{{image_source2}}" style="width: auto;   height: 170px;"></div>
                      </div>
					  
					  
					  <div class="form-group"  ng-show="doc3">
                        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="last-name">APAR <span class="required">*</span>
                        </label>
                        <div class="col-md-6 col-sm-6 col-xs-12">
                          <input type="file" ng-model="form.service3" accept="image/*" onchange="angular.element(this).scope().uploadedFile3(this)" name="ap" id="ap" class="form-control col-md-7 col-xs-12">
						   <button id="send" type="button" class="btn btn-success" ng-click="submitdocs3()">Upload</button>
                        </div>
						 <div class="col-md-3 col-sm-3 col-xs-12"><img ng-src="{{image_source3}}" style="width: auto;   height: 170px;"></div>
                      </div>
                      
                      
                    </form>
                  </div>
                </div>
                
            
   

              </div>
            </div>
          </div>
        </div>
 <script src="<?php echo base_url();?>angular/employee_form.js"></script>