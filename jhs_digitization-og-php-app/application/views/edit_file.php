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
 <div class="right_col" role="main" ng-app="drm_app" ng-controller="drmCtrl">
          <div class="" ng-show="employee_frm">
            <div class="page-title">
                <div class="row">
                    <div class="col-md-11">
                        <h3>Property File Details</h3>
                    </div>
                    <div class="col-md-1"><a href="<?php echo base_url();?>file/file_listing" class="btn btn-primary">Back</a></div>
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
		<?php //echo '<pre>';print_r($file);exit;?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h2>Property File Edit</h2>
                        <ul class="nav navbar-right panel_toolbox">
                            <li><a class="collapse-link"><i class="fa fa-chevron-up"></i></a></li>                      
                        </ul>
                        <div class="clearfix"></div>
                    </div>
                    <div id="msg">
                        <?php 
                        if ($this->session->flashdata("error") != '') {
                            echo '<div class="alert alert-danger"><strong>Error! </strong>' . $this->session->flashdata("error") . '</div>';
                        }
                        if ($this->session->flashdata("success")!='') {
                            echo '<div class="alert alert-success"><strong>Success! </strong>' . $this->session->flashdata("success") . '</div>';
                        }
                        ?>
                    </div>
                  <div class="x_content"><div class="error" ng-bind="error" style="text-align:center"></div>
                    <form method="post" action="<?php echo base_url()?>file/updatefile" enctype="multipart/form-data">               
                        <div class="col-md-12" style="padding-left:25px;"></div>
                            <div class="col-md-12">&nbsp;</div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="item form-group">
                                        <label for="Type">Type</label>
                                        <div>
                                            <label class="radio-inline">
                                            <input type="radio" name="file_type" value="File" checked>File 
                                            </label>
                                            <?php echo form_error('file'); ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 item form-group">
                                    <label for="file_barcode">File Barcode</label><br>
                                    <span style="color:blue;"><strong><?php echo $file->file_barcode; ?></strong></span>
                                    <input type="hidden" id="file_barcode" class="form-control"  name="file_barcode" type="text" value="<?php echo $file->file_barcode; ?>" readonly="true">
                                    <?php echo form_error('file_barcode'); ?>

                                </div>
                                <div class="col-md-4 item form-group">
                                    <label for="file">File Name</label>
                                    <input id="file_name" class="form-control"  value="<?php echo $file->file_name; ?>" name="file_name" placeholder="Enter file name"  type="text">
                                    <?php echo form_error('file_name'); ?>
                                </div>
                                <div class="col-md-4 item form-group">
                                    <label for="holdername">Owner's Name</label>
                                    <input type="text" id="file_holder_name" name="file_holder_name" placeholder="Enter Holder's Name"  class="form-control col-md-7 col-xs-12" value="<?php echo $file->file_holder_name; ?>" >
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 item form-group">
                                    <label for="prefix">Shelf Barcode</label>
                                    <input id="shelf_barcode" class="form-control"  name="shelf_barcode" type="text" value="<?php echo $file->shelf_barcode;?>">
                                    <?php echo form_error('shelf_barcode'); ?>
                                </div>
<!--                                <div class="col-md-4 item form-group">
                                    <label for="type">Type</label>
                                    <select name="file_type"  class="form-control">
                                        <option value="File" selected="true">File</option>
                                    </select>
                                    <?php // echo form_error('file_type'); ?>
                                </div>-->
                                <div class="col-md-4 item form-group">
                                    <label for="year">Year</label>
                                    <!--<input type="text" id="file_year" name="file_year"  value="<?php echo $file->file_year; ?>" maxlength="4"  placeholder="Enter Year" onkeypress="return isNumber(event)" class="form-control">-->
                                    <select name="file_year" id="file_year" class="form-control">
                                        <option value="">Select Year</option>
                                        <?php for($i=1984; $i <= date('Y');$i++){?>
                                        <option value="<?php echo $i;?>" <?php if($file->file_year == $i){echo 'selected="selected"';}?>><?php echo $i;?></option>
                                        <?php }?>
                                    </select>
                                    <?php echo form_error('file_year'); ?>
                                </div>
                                <div class="col-md-4 item form-group">
                                    <label for="address">Address</label>
                                    <input type="text" id="file_address" name="file_address"  value="<?php echo $file->file_address; ?>"  placeholder="Enter Address"  class="form-control">
                                    <?php echo form_error('email'); ?>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 item form-group">
                                    <label for="pincode">Pincode</label>
                                    <input type="text" id="file_pincode" name="file_pincode" maxlength="6" placeholder="Enter 6 digit pincode"  class="form-control"  onkeypress="return isNumber(event)" value="<?php echo $file->file_pincode;?>" >
                                    <?php echo form_error('file_pincode'); ?>
                                </div>
                                <div class="col-md-4 item form-group">
                                    <label for="area">Area</label>
                                    <input type="text" id="file_area" name="file_area"  value="<?php echo $file->file_area; ?>"  placeholder="Enter Area"  class="form-control">
                                    <?php echo form_error('file_area'); ?>
                                </div>
                                <div class="col-md-4 item form-group">
                                    <label for="property_no">Property No</label>
                                    <input type="text" id="property_no" name="property_no"  value="<?php echo $file->property_no; ?>"  placeholder="Enter property no."  class="form-control">
                                    <?php echo form_error('property_no'); ?>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 item form-group">
                                    <label for="property_area">Property Area (in sq-feet)</label>
                                    <input type="text" id="property_area" name="property_area"  value="<?php echo $file->property_area; ?>"  placeholder="Enter property area"  class="form-control">
                                    <?php echo form_error('property_area'); ?>
                                </div>
                                <div class="col-md-4 item form-group">
                                    <label for="dealer">Dealer</label>
                                    <input type="text" id="file_dealer" name="file_dealer"  value="<?php echo $file->file_dealer; ?>"  placeholder="Enter Dealer"  class="form-control">
                                    <?php echo form_error('file_dealer'); ?>
                                </div>          
                                <div class="col-md-4 item form-group">
                                        <button id="send" type="submit" class="btn btn-success" >Submit</button>
                                        <button type="reset" class="btn btn-danger">Reset</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                
            
   

              </div>
            </div>
          </div>
    </div>
    <script>
    $(document).ready(function(){
        $('#msg').delay(1000).fadeOut(400);
    });
    </script>