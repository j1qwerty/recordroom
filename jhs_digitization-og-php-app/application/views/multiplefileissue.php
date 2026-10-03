<style>
    /*pagination*/
  .pagination > a, .pagination > strong{
      position: relative;
      float: left;
      padding: 6px 12px;
      margin-left: -1px;
      line-height: 1.42857143;
      color: #337ab7;
      text-decoration: none;
      background-color: #fff;
      border: 1px solid #ddd;
  }
  .pagination> a:focus, .pagination> a:hover, .pagination > strong:focus, .pagination > strong:hover {
      z-index: 2;
      color: #23527c;
      background-color: #eee;
      border-color: #ddd;
  }
  .pagination > strong {
      background: #337ab7;
      color: #fff;
      border: 1px solid #337ab7;
  }
  /*pagination*/
</style>
<div class="right_col" role="main">
    <div class="">
        <div class="page-title">
            <div class="title_left">
                <h3>Issued Transaction</h3>
            </div>
        </div>
        <?php // echo '<pre>';print_r($issue_detail);exit;?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h4>Issued To: <span style="color:blue;"><?php echo $employeeDetail->employee_name;?></span></h4>
                        <h6>Designation: <span><?php echo $employeeDetail->designation_name;?></span></h6>
                        <h6>Department: <span><?php echo $employeeDetail->department_name;?></span></h6>
                        <h6>Contact: <span><?php echo empty($employeeDetail->mobile)?'NA':$employeeDetail->mobile;?></span></h6>
                        <div class="clearfix"></div>
                    </div>
                    <div class="x_content">
                    <?php if(!empty($files)){?>
                    <table id="issue_list" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th width="15%">File Barcode</th>
                                <th width="15%">File Name </th>
                                <th>Shelf Barcode</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Issue Date</th>
                              </tr>
                        </thead>
                    <tbody>
                        <?php $i=1;
                        if(!empty($files)) {
                        foreach($files as $file) {?>
                            <tr id="r2"> 
                            <td><input type="checkbox" id="checkbox" class="checkbox" name="chk[]" value="<?php echo $file->file_id;?>" autocomplete="off"></td>
                            <td><?php echo $file->file_barcode;?></td>
                            <td><?php echo $file->file_name;?></td>
                            <td><?php echo $file->shelf_barcode;?></td>
                            <td><?php echo ucfirst($file->file_status);?></td>
                            <td><?php                                
                                    $str = $this->Record_model->getFileLocation($file->shelf_barcode);
                                    if($str){
                                        echo $location = $str->room_name.'/'.$str->section_name.'/'.$str->almirah_name.'/'.$str->shelf_name;
                                    }else{
                                        echo 'NA';
                                    }
                                ?></td>
                            <td><?php echo date('Y-m-d');?></td>
                        </tr><?php } ?> 
                           <?php } ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Select</th>
                            <th width="15%">File Barcode</th>
                            <th width="15%">File Name </th>
                            <th>Shelf Barcode</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Issue Date</th>
                        </tr>
                    </tfoot>
                    </table>
                    <!--<div class="pagination"><?php // echo $links; ?></div>-->
                    <?php }else{?>
                    <p>No record found.</p>
                    <?php }?> 
                    <form method="POST" action="<?php echo base_url();?>record/savemultipleissuefile" style="float:left;">
                        <?php 
                        foreach($files as $file){?>
                        <input type="hidden" name="file_id[]" value="<?php echo $file->file_id;?>">      
                        <?php } ?>
                        <input type="hidden" name="emp_id" value="<?php echo $employeeDetail->emp_id;?>">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="">Remark: </label>
                                    <div>
                                        <input type="text" name="remark" placeholder="Enter remark" class="form-control loginbox">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <!--<label class="" style="float:left;position: relative;top: 8px;">Issue Date: </label>-->
                                    <label class="">Issue Date: </label>
                                    <div class="remark-logo" style="float:left;margin-left: 10px;margin-bottom: 25px;">
                                        <input type="date" name="IssueDateNew" max="<?php echo date('Y-m-d');?>" class="form-control issue_date" id="issue_date" onblur="getissueDate(this.value);" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="submit" name="issue_multiple" class="btn btn-success"><i class="fa fa-check">Issue All</i></button>
                    </form>
                    <form method="post" action="<?php echo base_url();?>record/removeFile/<?php echo $employeeDetail->emp_id;?>">
                        <div class="col-xs-12">
                            <?php 
                            foreach($files as $file){?>
                            <input type="hidden" name="file_id_old[]" value="<?php echo $file->file_id;?>">      
                            <?php } ?>
                            <input type="hidden" name="remove_file_id[]" id="remove_file_id">
                            <input type="hidden" name="emp_id" value="<?php echo $employeeDetail->emp_id;?>">
<!--                            <a href="<?php // echo base_url();?>record/borrow_list" class="btn btn-primary" style="float: right;">
                                <i class="fa fa-plus"></i> Add More
                            </a>-->
                            <button type="submit" name="check_rmv" class="btn btn-danger check_rmv" style="float: right;" disabled="true">
                                <i class="fa fa-cross"></i> Remove Selected Files
                            </button>
                        </div>
                    </form>                    
                    </div>
               </div>
            </div>
        </div>
      
    </div>
</div>
<script type="text/javascript">
    function getissueDate(InputData){	
        $('#IssueDateNew').val(InputData);			
    }
    function remove_file(fileId){
        var file_id = fileId;
        $('.remove_file').val(file_id);
    }
    $(document).ready(function(){
        var file_id = [];
        var count = '0';
        $('.checkbox').click(function() {
            if ($(this).is(":checked")) {
                count++;
                file_id.push($(this).val());
                console.log('r');
                console.log(file_id);
                $('.check_rmv').removeAttr('disabled');
            }else{
                file_id.pop($(this).val());
                count--;
                if(count == '0'){
                $('.check_rmv').attr('disabled', true);
                count = '0';
                }else{
                    $('.check_rmv').removeAttr('disabled');
                    
                }
            }
            $('#remove_file_id').val(file_id);
        });

//    $('#issue_list').DataTable();

    });
</script>