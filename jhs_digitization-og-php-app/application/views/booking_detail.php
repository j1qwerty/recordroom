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
  #file_list_length{
      display: none;
  }
  #issue_detail_length{
      display: none;
  }
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
                        <div class="col-md-11">
                        <h4>Issued To: <span style="color:blue;"><?php echo $employeeDetail->employee_name;?></span></h4>
                        <h6>Designation: <span><?php echo $employeeDetail->designation_name;?></span></h6>
                        <h6>Department: <span><?php echo $employeeDetail->department_name;?></span></h6>
                        <h6>Contact: <span><?php echo empty($employeeDetail->mobile)?'NA':$employeeDetail->mobile;?></span></h6>
                        </div>
                        <div class="col-md-1"><a href="<?php echo base_url();?>record" class="btn btn-primary">Back</a></div>
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
                    <?php if(!empty($issue_detail)){?>
                    <table id="issue_detail" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th width="15%">File Barcode</th>
                                <th width="15%">File Name </th>
                                <th>Issued date</th>
                                <!--<th>Due Date</th>-->
                                <th>Previous Location(Shelf Barcode)</th>
                                <th>Remark</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                    <tbody>
                        <?php 
                        $i = 1;
                        foreach($issue_detail as $issue){?>
                        <tr>
                            <td><?php echo $i;?></td>
                            <td><?php echo $issue->file_barcode;?></td>
                            <td><?php echo $issue->file_name;?></td>
                            <td><?php echo $issue->issue_date;?></td>
                            <!--<td><?php // echo $issue->due_date;?></td>-->
                            <td><?php echo $issue->shelf_barcode;?></td>
                            <td><?php echo $issue->remark;?></td>
                            <td>
                                <a href="<?php echo base_url();?>record/returnfile/<?php echo $issue->issue_file_id;?>" class="btn btn-danger">Return</a>
                                <!--<button name="reissue" class="btn btn-primary" onclick="return confirm('Are you sure you want to re-issue the file?');"><i class="fa fa-check"></i> Re-Issue</button>-->
                            </td>
                        </tr>
                        <?php 
                        $i++;
                        }?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>#</th>
                            <th width="15%">File Barcode</th>
                            <th width="15%">File Name </th>
                            <th>Issued date</th>
                            <!--<th>Due Date</th>-->
                            <th>Previous Location(Shelf Barcode)</th>
                            <th>Remark</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                    </table>
                    <!--<div class="pagination"><?php // echo $links; ?></div>-->
                    <?php }else{?>
                    <p>No issued file.</p>
                    <?php }?> 
                    </div>
               </div>
            </div>
        </div>
        <?php // echo '<pre>';print_r($files);exit;?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <div class="col-md-10">
                        <h4>Property File</h4>
                        </div>
                        <div class="col-md-2">
                            <form method="post" action="<?php echo base_url();?>record/multipleFileIssue/<?php echo $employeeDetail->emp_id;?>">
                                <div class="col-xs-12">
                                    <input type="hidden" name="file_id[]" id="file_id">
                                    <!--<input type="hidden" name="emp_id" id="emp_id2" value="<?php // echo $employeeDetail->emp_id;?>">-->
                                    <button type="submit" name="selected" class="btn btn-success selected issueallfiles" disabled="true">
                                        <i class="fa fa-check"></i> Issue All Files
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div class="clearfix"></div>
                    </div>
                    
                    <?php if(!empty($files)){?>
                    <table id="file_list" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th class="checkall"><input type="checkbox" name="selectall" id="select_all"> All</th>
                                <th width="15%">File Barcode</th>
                                <th width="15%">File Name </th>
                                <th>Shelf Barcode</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Issue Date</th>
                                <th>Action</th>
                              </tr>
                        </thead>
                    <tbody>
                        <?php $i=1;
                        if(!empty($files)) {
                        foreach($files as $file) {
//                            ++$page;
                            if($file->file_status == 'Issued'){?>
                        <tr style="background-color: #f7e8d8;" title="This file is already issued">
                                <td></td>
                            <?php }else{?>
                            <tr id="r2"> 
                            <td><input type="checkbox" id="checkbox" class="checkbox" name="chk[]" value="<?php echo $file->file_id;?>" autocomplete="off"></td>
                            <?php }?>
                            <td><?php echo $file->file_barcode;?></td>
                            <td><?php echo $file->file_name;?></td>
                            <td><?php echo $file->shelf_barcode;?></td>
                            <td><?php echo ucfirst($file->file_status);?></td>
                            <td><?php 
                                if($file->file_status == 'Issued'){
                                    $emp = $this->Record_model->getIssuedEmp($file->file_barcode);?>
                                    <span>
                                        <p style="margin:0px;"><strong><?php echo '('. $emp->employee_code .')';?></strong></p>
                                        <p style="margin:0px;"><?php echo $emp->employee_name;?></p>
                                        <p style="margin:0px;"><?php echo ucfirst(strtolower($emp->designation_name));?></p>
                                        <p style="margin:0px;"><?php echo $emp->department_name;?></p>
                                    </span>    
                                <?php }else{
                                    $str = $this->Record_model->getFileLocation($file->shelf_barcode);
                                    if($str){
                                    echo $location = $str->room_name.'/'.$str->section_name.'/'.$str->almirah_name.'/'.$str->shelf_name;
                                    }else{
                                        echo 'NA';
                                    }
                                }?></td>
                            <td ><?php
                            if($file->file_status == 'Issued'){
                                $issue = $this->Record_model->getIssueDetail($file->file_barcode);
                                echo $issue->issue_date;
                            }else{?>
                                <input type="date" name="issue_date" max="<?php echo date('Y-m-d');?>" class="form-control issue_date" id="issue_date" onblur="getissueDate(this.value);" title="Enter Date"/>
                                <input type="text" name="remark" class="form-control remark" id="remark" placeholder="Remark"  onblur="getRemarkData(this.value);" title="Enter Remark">										
                            <?php } ?>
                            </td>
                            <td>
                                <?php if ($file->file_status == 'Issued') {?>
                                        <button name="" class="btn btn-default" disabled="" > Issued</button>
                                <?php }else{ ?> 
                                <form method="post" action="<?php echo base_url();?>record/issue_file">
                                    <input type="hidden" name="issue_date" id="IssueDateNew" value="" />
                                    <input type="hidden" name="remark" id="getRemarkNew" value="" />
                                    <input type="hidden" name="emp_id" value="<?php echo $employeeDetail->emp_id;?>">
                                    <input type="hidden" name="file_barcode" value="<?php echo $file->file_barcode;?>">
                                    <button type="submit" name="issue_btn" class="btn btn-info issue_btn" id="issue_btn" onclick="return confirm('Are you sure you want to issue this file?');" title="Click here to issue file"><i class="fa fa-check"></i> Issue</button>
                                </form>
                                <?php } ?>
                            </td>
                        </tr><?php } ?> 
                           <?php } ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>#</th>
                            <th width="15%">File Barcode</th>
                            <th width="15%">File Name </th>
                            <th>Shelf Barcode</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Issue Date</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                    </table>
                    <!--<div class="pagination"><?php // echo $links; ?></div>-->
                    <?php }else{?>
                    <p>No record found.</p>
                    <?php }?>
                </div>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    $(document).ready(function(){
        
        $('#file_list').DataTable();
        $('#issue_detail').DataTable();
        
        var file_id = [];
        var count = '0';

        $('.checkbox').click(function() {

            if ($(this).is(":checked")) {
                file_id.push($(this).val());
                console.log(file_id);
                count++;
                $('.selected').removeAttr('disabled');
                $('.issue_btn').attr('disabled', true);
                $('.issue_date').attr('disabled', true);
                $('.remark').attr('disabled', true);
            }else{
                file_id.pop($(this).val());
                console.log(file_id);
                count--;
                $("#select_all").removeAttr("checked");
                if(count == '0'){
                    $('.issue_btn').removeAttr('disabled');
                    $('.issue_date').removeAttr('disabled');
                    $('.remark').removeAttr('disabled');
                    count = '0';
                }else{
                    $('.selected').removeAttr('disabled');
                    $('.issue_btn').attr('disabled', true);
                    $('.issue_date').attr('disabled', true);
                    $('.remark').attr('disabled', true);
                }
            }
            $('#file_id').val(file_id);
        });
        //-----footer function------------
        function totalchecked1() {
            var total = $('#lpForm').find('input[name="chk[]"]:checked').length;

        }
        
        $(".check").click(function () {
            if ($(".check").length == $(".check:checked").length) {
                $("#select_all").prop('checked', this.checked)
            } else {
                $("#select_all").removeAttr("checked");
            }
            totalchecked1();
        });
        //----------------------------------------------------------------------
        $("#select_all").click(function () {
            $('input:checkbox').not(this).prop('checked', this.checked);
            totalchecked1();
        });
        $('#select_all').click(function(){
            if ($(this).is(":checked")) {
                $('.checkbox').each(function(key,value){
                    if ($(this).is(":checked")) {
                        file_id.push($(this).val());
                        console.log(file_id);
                    }else{
                        file_id.pop($(this).val());
                        console.log(file_id);
                    }
                });
                                
                $('.selected').removeAttr('disabled');
                $('.issue_btn').attr('disabled', true);
                $('.issue_date').attr('disabled', true);
                $('.remark').attr('disabled', true);
            }else{
                $('.issue_btn').removeAttr('disabled');
                $('.issue_date').removeAttr('disabled');
                $('.remark').removeAttr('disabled');
            }
//              $('#file_id').val('all');
                $('#file_id').val(file_id);
        });
    });
    
    function getissueDate(InputData){	
        $('#IssueDateNew').val(InputData);			
    }

    function getRemarkData(InputData){
        $('#getRemarkNew').val(InputData);		
    }
</script>