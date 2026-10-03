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
<script>
$(document).ready(function(){
	var retcode = getName();
	if(retcode){
		$("#shelf_barcode").val(retcode);
	}else{
		updateCode();
	}

	function getName(){
		return localStorage.getItem("fileCode");
	}
});

function updateCode(){
	var code = $("#shelf_barcode").val();	
	localStorage.setItem("fileCode", code);
}

</script>
<div class="right_col">
    <div class="" ng-show="employee_frm">
        <div class="page-title">
            <div class="title_left">
                <h3>Property File Details</h3>
            </div>
        </div>
        
        <div class="clearfix"></div>
            <div class="row">
		<div class="col-md-12 col-sm-12 col-xs-12">
                    <div class="x_panel">
                        <div class="x_title">
                            <h2>Property File Information</h2>
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
                        <div class="x_content">
                            
                            <form class="falanae" action="<?php echo base_url();?>file/make_file" onSubmit="updateCode();" name="fileform" method="post">               
                                <div class="col-md-12" style="padding-left:25px;"></div>
                                <div class="col-md-12">&nbsp;</div>
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
                                <div class="col-md-12">
                                    <div class="item form-group">
                                        <label for="file_barcode">File Barcode <span style="color:red">*</span></label>
                                        <input id="file_barcode" class="form-control"  name="file_barcode" placeholder="Enter file barcode"  type="text" value="<?php echo set_value('file_barcode'); ?>">
                                        <?php echo form_error('file_barcode'); ?>
                                        <p id="duplicatecheck">This file barcode already exists! </p>
                                    </div>
                                    <div class="item form-group">
                                        <label for="file">File Name <span style="color:red">*</span></label>
                                        <input id="file_name" class="form-control"  value="<?php echo set_value('file_name'); ?>" name="file_name" placeholder="Enter file name"  type="text">
                                        <?php echo form_error('file_name'); ?>
                                    </div>
                                    <div class="item form-group">
<!--                                        <label for="holdername">Holder's Name</label>-->
                                        <label for="holdername">Owner's Name</label>
                                        <input type="text" id="file_holder_name" name="file_holder_name" placeholder="Enter Holder's Name"  class="form-control col-md-7 col-xs-12" value="<?php echo set_value('file_holder_name'); ?>" >
                                    </div>
                                    <div class="item form-group">
                                        <label for="prefix">Shelf Barcode <span style="color:red">*</span></label>
                                        <input id="shelf_barcode" class="form-control"  name="shelf_barcode" placeholder="Enter Shelf Barcode"  type="text" value="<?php if(isset($shelf_barcode_prev->shelf_barcode)){echo $shelf_barcode_prev->shelf_barcode;} ?>">
                                        <?php echo form_error('shelf_barcode'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="year">Year <span style="color:red">*</span></label>
                                            <select name="file_year" id="file_year" class="form-control">
                                                <option value="">Select Year</option>
                                                <?php for($i=1984; $i <= date('Y');$i++){?>
                                                <!--<option value="<?php //echo $i;?>" <?php //if(date('Y')==$i){echo 'selected="selected"';}else{echo '';}?>><?php //echo $i;?></option>-->
                                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
												<?php }?>
                                            </select>
                                        <?php echo form_error('file_year'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="area">Area <span style="color:red">*</span></label>
                                        <!--<input type="text" id="file_area" name="file_area"  value="<?php echo set_value('file_area'); ?>"  placeholder="Enter Area"  class="form-control" autocomplete="on">-->
                                        <select name="file_area" id="file_area" class="js-example-basic-single form-control">
                                            <option value="">Select Area</option>
                                            <?php foreach($area_list as $area){?>
                                            <option value="<?php echo $area->area_id;?>"><?php echo $area->area_name;?></option>
                                            <?php }?>
                                        </select>
                                            <?php echo form_error('file_area'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="pincode">Pincode <span style="color:red">*</span></label>
                                        <input type="text" id="file_pincode" name="file_pincode" maxlength="6" placeholder="Enter 6 digit pincode"  class="form-control"  onkeypress="return isNumber(event)" value="<?php echo set_value('file_pincode'); ?>" readonly="true">
                                        <?php echo form_error('file_pincode'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="address">Address <span style="color:red">*</span></label>
                                        <input type="text" id="file_address" name="file_address"  value="<?php echo set_value('file_address'); ?>"  placeholder="Enter Address"  class="form-control">
                                        <?php echo form_error('file_address'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="property_no">Property No <span style="color:red">*</span></label>
										<!--<input type="text" id="property_no" name="property_no"  value="<?php //echo set_value('property_no'); ?>"  placeholder="Enter property no."  class="form-control">-->
                                        <input type="text" id="property_no" name="property_no"  value="NA"  placeholder="Enter property no."  class="form-control">
										<?php echo form_error('property_no'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="property_area">Property Area (in sq-meter) <span style="color:red">*</span></label>
                                        <input type="text" id="property_area" name="property_area"  value="<?php echo set_value('property_area'); ?>"  placeholder="Enter property area."  class="form-control">
                                        <?php echo form_error('property_area'); ?>
                                    </div>
                                    <div class="item form-group">
                                        <label for="dealer">Dealer <span style="color:red">*</span></label>
                                        <!--<input type="text" id="file_dealer" name="file_dealer"  value="<?php //echo set_value('file_dealer'); ?>"  placeholder="Enter Dealer"  class="form-control">-->
										<input type="text" id="file_dealer" name="file_dealer"  value="OTHER" placeholder="Enter Dealer"  class="form-control">
                                        <?php echo form_error('file_dealer'); ?>
                                    </div>          
                                    <!--<div class="ln_solid"></div>-->
                                    <div class="item form-group">
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.inputmask/3.1.62/jquery.inputmask.bundle.js"></script>
<script>

function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}

    $(document).ready(function(){
	$("#file_barcode").blur(function(){
		var file_barcode = $(this).val();
		$.post( 
                    "<?php echo base_url()?>file/checkfilebarcode",
                    { file_barcode: file_barcode },
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
        $("#file_area").change(function(){
            var area_id = $(this).val();
            $.ajax({url: "<?php echo base_url()?>file/getpincode/"+area_id, success: function(result){
                $("#file_pincode").val(result);
            }});
        });
        
    
        $('.js-example-basic-single').select2();
    });
</script>
		