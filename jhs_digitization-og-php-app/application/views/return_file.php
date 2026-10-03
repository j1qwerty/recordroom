<div class="right_col" role="main">
    <div class="">
        <div class="page-title">
            <div class="title_left">
                <h3>Return File</h3>
            </div>
        </div>
        <?php // echo '<pre>';print_r($roomList);exit;?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <div class="col-md-11">
                        <h4>Issued To: <span style="color:blue;"><?php echo $employeeDetail->employee_name;?></span></h4>
                        <h6>Designation: <span><?php echo $employeeDetail->designation_name;?></span></h6>
                        <h6>Department: <span><?php echo $employeeDetail->department_name;?></span></h6>
                        <h6>Contact: <span><?php echo empty($employeeDetail->mobile)?'NA':$employeeDetail->mobile;?></span></h6>
                        </div>
                        <div class="col-md-1">
                            <a href="<?php echo base_url();?>record/borrow_list/<?php echo $issueDetail->emp_id;?>" class="btn btn-primary">Back</a>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                    <div class="x_content">
                    <form action="<?php echo base_url();?>record/return_file" method="post" enctype="multipart/form-data" id="fileForm" class="form-horizontal form-label-left" autocomplete="off">
                    <input type='hidden' name='emp_id' value='<?php echo $issueDetail->emp_id;?>'>
                    <input type='hidden' name='issue_file_id' value='<?php echo $issueDetail->issue_file_id;?>'>
                    <input type='hidden' name='file_barcode' value='<?php echo $issueDetail->file_barcode;?>'>
                    <input type='hidden' name='shelf_name_prev' value='<?php echo $issueDetail->shelf_barcode; ?>' id="shelf_new">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="control-label col-md-4">Employee Code <span class="required" style="color:red;">*</span>
                                </label>
                                <div class="col-md-8">
                                    <!--<input type="text" value="<?php // if(!empty($_GET['employee_id'])){echo $_GET['employee_id'];} ?>" name="pf_no" placeholder="Enter Employee ID" class="form-control loginbox col-md-7 col-xs-12" required="">-->
                                    <input type="text" value="<?php if(!empty($employeeDetail->employee_code)){echo $employeeDetail->employee_code;} ?>" name="employee_code" placeholder="Enter Employee Code" class="form-control loginbox col-md-7 col-xs-12" required="">
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="control-label col-md-4">Shelf Barcode</label>
                                <div class="col-md-8">
                                    <input type="text" value="<?php if(!empty($issueDetail->shelf_barcode)){echo $issueDetail->shelf_barcode;}?>" name="shelf_barcode" id="shelf_barcode" placeholder="Shelf Barcode" class="form-control loginbox col-md-7 col-xs-12" required="">
                                    <!--<span id="shelfDetail"></span>-->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6"></div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="control-label col-md-4"></label>
                                <div class="col-md-8">
                                    <button type="button" id="palceLocation" class="btn btn-warning">Choose File Placement Location</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <span id="fileLocaton" style="display: none;">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label col-md-4" >Room</label>
                                    <div class="col-md-8">
                                        <select name="room_id" id="room_id" class="form-control">
                                            <option value="">--Select Room--</option>
                                            <?php foreach($roomList as $room){    ?>
                                                <option value="<?php echo $room->room_id; ?>"><?php echo $room->room_name; ?></option>
                                            <?php } ?>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label col-md-4" >Section</label>
                                    <div class="col-md-8 almirah_id">
                                        <select name="section" id="room_section" class="form-control">
                                            <option value="">--Select Section--</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label col-md-4" >Almirah</label>
                                    <div class="col-md-8 almirah_id">
                                        <select name="almirah_id" id="almirah_id" class="form-control">
                                            <option value="">--Select Almirah--</option>                                             
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label col-md-4">Shelf</label>
                                    <div class="col-md-8 shelf_id">                                         
                                        <select name="shelf" id="shelf" class="form-control">
                                            <option value="">--Select Shelf--</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </span>
                    <div class="row">
                        <div class="col-md-6">
                            
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <div class="col-md-4"></div>
                                <div class="col-md-8 col-sm-8 col-xs-12 ">
                                    <button type="reset" class="btn btn-primary"><i class="fa fa-times-circle-o"></i> Reset</button>
                                    <button type="submit" name="submit" class="btn btn-success"><i class="fa fa-plus-square"></i> Submit</button>
                                </div>
                            </div>
                        </div>                        
                    </div>
                </form>
                    </div>
               </div>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
$(document).ready(function(){
       
   $('#room_id').change(function(){
        var roomId = $(this).val();
        $.ajax({
            type:'POST',
            url:'<?php echo base_url();?>record/getSection',
            data:{room_id:roomId},
            beforeSend:function(){},
            success:function(data){
                $('#room_section').html(data);
            },
            error:function(data){
                $('#room_section').append('<option value="">--Error--</option>')
            }
        });
    });
    $('#room_section').change(function(){
            var section_id = $(this).val();
            $.ajax({
                type: 'POST',
                url:'<?php echo base_url();?>record/getAlmirah',
                data: {section_id:section_id},
                beforeSend: function () {},
                success: function (data) {
                    $('#almirah_id').html(data);
                },
                error: function (data) {
                    $('#almirah_id').append('<option value="">--Error--</option>')
                }
            });
        });
        $('#almirah_id').change(function(){
            var almirah_id = $('#almirah_id').val();
            $.ajax({
                type: 'POST',
                url:"<?php echo base_url();?>record/getShelf",
                data: {almirah_id: almirah_id},
                beforeSend: function () {},
                success: function (data) {
                    $('#shelf').html(data);
                },
                error: function (data) {
                    $('#shelf').append('<option value="">--Error--</option>')
                }
            });
        });
    $('#shelf').change(function(){
        var shelf_id = $(this).val();
        $.ajax({
            type:"POST",
            url:"<?php echo base_url();?>record/getShelfBarcode",
            data:{shelf_id:shelf_id},
            beforeSend:function(){},
            success:function(data){
                $('#shelf_barcode').val(data);
                $('#shelf_new').val(data);
            },
            error:function(data){
                console.log(data);
            }
        });

    });
    $('#palceLocation').click(function(){
        var btnText = $(this).text();
        if(btnText == 'Hide'){
            $(this).text('Choose File Placement Location');
            $('#shelf_barcode').removeAttr('disabled');
            $('#fileLocaton').hide();
        }else{
            $(this).text('Hide');
            $('#shelf_barcode').attr('disabled',true);
            $('#fileLocaton').show();
        }        
    });
  });
  </script>