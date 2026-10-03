<style type="text/css">
  .inner {
    text-align: center;
  }

  .small-box {
    height:130px;
    display: table-cell;
    vertical-align: middle;
  }
  .small-box{border-radius:2px;position:relative;display:block;margin-bottom:20px;box-shadow:0 1px 1px rgba(0,0,0,0.1)}.small-box>.inner{padding:10px}.small-box>.small-box-footer{position:relative;text-align:center;padding:3px 0;color:#fff;color:rgba(255,255,255,0.8);display:block;z-index:10;background:rgba(0,0,0,0.1);text-decoration:none}.small-box>.small-box-footer:hover{color:#fff;background:rgba(0,0,0,0.15)}.small-box h3{font-size:38px;font-weight:bold;margin:0 0 10px 0;white-space:nowrap;padding:0}.small-box p{font-size:15px}.small-box p>small{display:block;color:#f9f9f9;font-size:13px;margin-top:5px}.small-box h3,.small-box p{z-index:5px}.small-box .icon{-webkit-transition:all .3s linear;-o-transition:all .3s linear;transition:all .3s linear;position:absolute;top:-10px;right:10px;z-index:0;font-size:90px;color:rgba(0,0,0,0.15)}.small-box:hover{text-decoration:none;color:#f9f9f9}.small-box:hover .icon{font-size:95px}@media (max-width:767px){.small-box{text-align:center}.small-box .icon{display:none}.small-box p{font-size:12px}}

  .not-active {
    pointer-events: none;
    cursor: default;
    text-decoration: none;
    color: black;
  }
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
<?php // echo '<pre>';print_r($_SESSION);exit;?>
<div class="right_col" role="main">
    <div class="">
        <div class="page-title">
            <div class="title_left">
                <h3>Dashboard</h3>
            </div>
        </div>
        <div class="clearfix"></div>
        <section class="content">
            <div class="row">
                <div class="col-lg-2 col-xs-6">
                    <a href="<?php echo base_url(); ?>user/employee_listing" class="small-box-footer">
                        <div class="small-box bg-blue">
                            <div class="inner">
                                <h3><?php echo $this->User_model->employee_count()->mycount; ?></h3>
                                <p>Employee</p>
                            </div>
                            <div class="icon">
                                <i class="ion ion-stats-bars"></i>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-lg-2 col-xs-6">
                <a href="<?php echo base_url(); ?>file/file_listing" class="small-box-footer">
                    <div class="small-box bg-red">
                        <div class="inner">
                            <h3><?php echo $this->User_model->file_count()->mycount; ?></h3>
                            <p>Property File</p>
                        </div>
                        <div class="icon">
                            <i class="ion ion-stats-bars"></i>
                        </div>
                    </div>
                </a>
            </div>
        </div>
        </section>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h4>Search File</h4>
                        <div class="clearfix"></div>
                    </div>
                    <!--<form class="falanae" action="<?php echo base_url();?>file/search_file" name="fileform" method="post">
                        <div class="item form-group" style="margin-top:1%;">
                            <div class="col-sm-4" style="padding-left:0px;">
                                <input id="search" class="form-control" value="<?php echo set_value('search'); ?>" name="search" placeholder="Enter file barcode" type="text">
                                <?php echo form_error('search'); ?>  
                            </div>
                            <button id="send" type="submit" class="btn btn-success">Search</button>
                        </div>
                    </form>-->
                    <form class="falanae" action="<?php echo base_url();?>file/search_dashboard_file" name="fileform" method="post">
                        <div class="item form-group" style="margin-top:1%;padding: 10px;">
                            <div class="row">
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="search" class="form-control" value="<?php echo set_value('search'); ?>" name="search" placeholder="Enter file barcode/name" type="text">
                                </div>
                                <div class="col-md-3" style="padding-left:0px;">
                                    <select id="year" class="form-control" name="year">
                                        <option value="">Select Year</option>
                                        <?php foreach($year_list as $year){?>
                                        <option value="<?php echo $year->file_year;?>"><?php echo $year->file_year;?></option>
                                        <?php } ?>
                                    </select>
                                </div>
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="file_holder_name" class="form-control" value="<?php echo set_value('file_holder_name'); ?>" name="file_holder_name" placeholder="Enter owner name" type="text">
                                </div>
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="shelf_barcode" class="form-control" value="<?php echo set_value('shelf_barcode'); ?>" name="shelf_barcode" placeholder="Enter shelf barcode" type="text">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-3" style="padding-left:0px;">
                                    <!--<input id="file_area" class="form-control" value="<?php echo set_value('file_area'); ?>" name="file_area" placeholder="Enter Area" type="text">-->
                                        
                                        <select name="file_area" id="file_area" class="js-example-basic-single form-control">
                                            <option value="">Select Area</option>
                                            <?php foreach($area_list as $area){?>
                                            <option value="<?php echo $area->area_id;?>"><?php echo $area->area_name;?></option>
                                            <?php }?>
                                        </select>
                                </div>
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="file_pincode" class="form-control" value="<?php echo set_value('file_pincode'); ?>" name="file_pincode" placeholder="Enter Pincode" type="text">
                                </div>
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="file_address" class="form-control" value="<?php echo set_value('file_address'); ?>" name="file_address" placeholder="Enter File Address" type="text">
                                </div>
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="property_no" class="form-control" value="<?php echo set_value('property_no'); ?>" name="property_no" placeholder="Enter Property No." type="text">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-3" style="padding-left:0px;">
                                    <input id="file_dealer" class="form-control" value="<?php echo set_value('file_dealer'); ?>" name="file_dealer" placeholder="Enter Dealer" type="text">
                                </div>
                                <div class="col-md-3">
                                    <button id="send" type="submit" class="btn btn-success">Search</button>
                                    <button class="btn btn-danger"><a href="<?php echo base_url();?>user/dashboard" style="color:white;">Reset</a></button>
                                </div>
                            </div>
                        </div>
                    </form>
                    <div class="row">
                        <div class="col-md-12">
                            <?php if(isset($search_data)){?>
                            <label>Search For:</label>
                            <?php foreach($search_data as $key => $value){?>
                            <span style="color:red;"><?php if(!empty($value)){echo $value;}?></span>
                            <span><?php if(!empty($value)){echo ' | ';}?></span>
                            <?php } }?>
                        </div>
                    </div>
                    <?php if(!empty($employees)){?>
                    <table id="example" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th width="15%">File Barcode</th>
                                <th width="15%">File Name </th>
                                <th>Owner's Name</th>
                                <th>Shelf Barcode</th>
                                <th>Address</th>
                                <th>View</th>
                                <th>Upload</th>
                              </tr>
                        </thead>
                    <tbody>
                        <?php $i=1;
                        if(!empty($employees)) {
                        foreach($employees as $emp) {?>
                            <tr id="r2">
                            <td><?php echo ++$page;?></td>
                            <td><?php echo $emp->file_barcode?></td>
                            <td><?php echo $emp->file_name?></td>
                            <td><?php echo $emp->file_holder_name?></td>
                            <td><?php echo $emp->shelf_barcode?></td>
                            <td><?php echo ucwords($emp->file_address)?></td>
                            <td>

                             <a class="btn btn-primary btn-sm <?php if(count($this->User_model->getallFileCopy($emp->file_barcode)) == 0) echo 'not-active'; ?>" href="<?php echo base_url();?>user/viewFileCopy/<?php echo $emp->file_barcode?>"><span class="glyphicon glyphicon-eye-open"></span> FILE (<?php echo count($this->User_model->getallFileCopy($emp->file_barcode)); ?>)</a>
                             <a class="btn btn-primary btn-sm <?php if(count($this->User_model->getMAPdetail($emp->file_barcode)) == 0) echo 'not-active'; ?>" href="<?php echo base_url();?>user/viewMapData/<?php echo $emp->file_barcode?>"><span class="glyphicon glyphicon-eye-open"></span> MAP (<?php echo count($this->User_model->getMAPdetail($emp->file_barcode));?>)</a>
                             <a class="btn btn-primary btn-sm" href="<?php echo base_url();?>user/view_report_log/<?php echo $emp->file_barcode?>"><span class="glyphicon glyphicon-eye-open"></span> Report Log </a>


                            </td>

                           <?php if($this->session->userdata("user_type")!='Verifier') { ?>
                               <td> 
                                   <a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/uploadfile/<?php echo $emp->file_barcode?>"><span class="glyphicon glyphicon-cloud-upload"></span> FILE</a>
                                   <a class="btn btn-success btn-sm" href="<?php echo base_url();?>user/upload_map/<?php echo $emp->file_barcode?>"><span class="glyphicon glyphicon-cloud-upload"></span> MAP</a>
                                   <?php if($this->session->userdata("user_type")=='Admin')
                                   {?>
                                       <a class="btn btn-success btn-sm" href="<?php echo base_url();?>file/edit_file/<?php echo $emp->file_barcode?>">
                                       <span class="glyphicon glyphicon-edit"> </span> Edit</a>
                                       <a href="<?php echo base_url();?>file/deletefile/<?php echo $emp->file_barcode ?>" onClick="return confirm('Do you really want to delete?')" class="btn btn-danger btn-sm">Delete</a>
                                   <?php } ?>  
                               </td>

                             <?php } ?>

                             </tr><?php } ?> 

                           <?php } ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>#</th>
                            <th width="15%">File Barcode</th>
                            <th width="15%">File Name </th>
                            <th>Holder's Name</th>
                            <th>Shelf Barcode</th>
                            <th>Address</th>
                            <th>View</th>
                            <th>Upload</th>
                          </tr>
                    </tfoot>
                    </table>
                    <div class="pagination"><?php echo $links; ?></div>
                    <?php }else{?>
                    <p>No record found.</p>
                    <?php }?>
                </div>
            </div>
        </div>
    </div>
</div>
<!--<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">-->
