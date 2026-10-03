<style>
  #room_list_length{
      display: none;
  }
  .item p {
    margin: 0px;
    color: red;
}
</style>
<div class="right_col" role="main">
    <div class="">
        <div class="page-title">
            <div class="title_left">
                <h3>Room</h3>
            </div>
        </div>
        <?php // echo '<pre>';print_r($files);exit;?>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <?php if(isset($room_detail)){?>
                        <h4 style="float: left;">Edit</h4>
                        <a href="<?php echo base_url();?>store/room" class="btn btn-primary" style="margin-left: 900px;">Back</a>
                        <?php }else{ ?>
                        <h4>Add</h4>
                        <?php } ?>
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
                    <div class="row">
                        <?php if(isset($room_detail)){?>
                        <form method="POST" name="room_edit" action="<?php echo base_url();?>store/updateroom">
                            <input  type="hidden" id="room_id" class="form-control"  value="<?php echo $room_detail->room_id; ?>" name="room_id">
                            <div class="col-md-6">
                                <div class="item form-group">
                                    <label for="room_name">Name <span style="color:red">*</span></label>
                                    <input  type="text" id="room_name" class="form-control"  value="<?php echo $room_detail->room_name; ?>" name="room_name" placeholder="Enter room name" required="true" maxlength="20">
                                    <?php echo form_error('room_name'); ?>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div style="padding-left:17px;margin-top: 22px;">
                                    <button id="send" type="submit" class="btn btn-success" >Update</button>
                                    <button type="reset" class="btn btn-danger">Reset</button>
                                </div>
                            </div>
                        </form>
                        <?php }else{?>
                        <form method="POST" name="room_frm" action="<?php echo base_url();?>store/addroom">
                            <div class="col-md-6">
                                <div class="item form-group">
                                    <label for="room_name">Name <span style="color:red">*</span></label>
                                    <input  type="text" id="room_name" class="form-control"  value="<?php echo set_value('room_name'); ?>" name="room_name" placeholder="Enter room name" required="true" maxlength="20">
                                    <?php echo form_error('room_name'); ?>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div style="padding-left:17px;margin-top: 22px;">
                                    <button id="send" type="submit" class="btn btn-success" >Submit</button>
                                    <button type="reset" class="btn btn-danger">Cancel</button>
                                </div>
                            </div>
                        </form>
                        <?php } ?>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12 col-sm-12 col-xs-12">
                <div class="x_panel">
                    <div class="x_title">
                        <h4>List</h4>
                        <div class="clearfix"></div>
                    </div>
                    
                    <?php if(!empty($room_list)){?>
                    <table id="room_list" class="table table-striped table-bordered" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                        </thead>
                    <tbody>
                        <?php $i=1;
                        if(!empty($room_list)) {
                            $i = 0;
                            foreach($room_list as $list) {
                            $ct = $this->Store_model->checkRoomSectionAvail($list->room_id);?>
                            <tr id="r2"> 
                            <td><?php echo ++$i;?></td>
                            <td><?php echo $list->room_name;?></td>
                            <td><?php echo ($list->room_status == '1')?'Active':'Inactive';?></td>
                            <td><a href="<?php echo base_url();?>store/editroom/<?php echo $list->room_id;?>" title="Edit"><i class="fa fa-pencil"></i></a>
                                <?php if($ct->total == '0'){ 
                                    if($list->room_status == '1'){echo ' | ';?>
                                <a href="<?php echo base_url();?>store/inactiveroom/<?php echo $list->room_id;?>" title="Inactive">
                                    <i class="fa fa-thumbs-down" aria-hidden="true" style="color:red;"></i></a>
                                    <?php }else{  echo ' | ';?>
                                <a href="<?php echo base_url();?>store/activeroom/<?php echo $list->room_id;?>" title="Active">
                                    <i class="fa fa-thumbs-up" aria-hidden="true" style="color:green;"></i></a>
                                <?php }}?></td>
                        </tr><?php } ?> 
                           <?php } ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                    </table>
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
        $('#room_list').DataTable();
    });
</script>

