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
  #returned_list_length{
      display: none;
  }
</style>
<div class="right_col" role="main">
    <div class="">
        <div class="page-title">
            <div class="title_left">
                <h3>Returned File List</h3>
            </div>
        </div>
        <?php // echo '<pre>';print_r($files);exit;?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h4>File</h4>
                        <div class="clearfix"></div>
                    </div>
                    
                    <?php if(!empty($files)){?>
                    <table id="returned_list" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th width="15%">File Barcode</th>
                                <th width="15%">File Name </th>
                                <th>Shelf Barcode</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Returned Date</th>
                                <!--<th>Action</th>-->
                              </tr>
                        </thead>
                    <tbody>
                        <?php $i=1;
                        if(!empty($files)) {
                        foreach($files as $file) {?>
                            <tr id="r2"> 
                            <td><?php echo ++$page;?></td>
                            <!--<td><input type="checkbox" id="checkbox" class="checkbox" name="chk[]" value="<?php echo $file->file_id;?>" autocomplete="off"></td>-->
                                <!--<td></td>-->
                            <td><?php echo $file->file_barcode;?></td>
                            <td><?php echo $file->file_name;?></td>
                            <td><?php echo $file->shelf_barcode;?></td>
                            <td><?php echo ucfirst($file->issue_status);?></td>
                            <td title="Room/Section/Almirah/Shelf"><?php 
                                echo $file->room_name.'/'.$file->section_name.'/'.$file->almirah_name.'/'.$file->shelf_name;
//                              ?>
                            </td>
                            <td><?php echo $file->returned_date;?></td>
                            <!--<td></td>-->
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
                            <th>Returned Date</th>
                            <!--<th>Action</th>-->
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
        $('#returned_list').DataTable();
    });
</script>

