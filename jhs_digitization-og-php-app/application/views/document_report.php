<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.min.js"></script>
<script src="<?php echo base_url(); ?>js/dataTables.bootstrap.min.js"></script>
<link rel="stylesheet" href="<?php echo base_url(); ?>css/dataTables.bootstrap.min.css">

<style>
    .cell_width{
        width:20%;
    }
    .error{
        color:red;
        font-weight:bold;

    }
    .item  p{
        margin:0px;
        color:red;
    }

    .btn-sm {
        padding: 5px 5px;
        font-size: 11px;
    }

    .buttons-flash {
        color: #fff;
        background-color: #398439;
    }

    .buttons-flash:hover {
        color: #fff;
    }
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

</style>
<?php
//echo '<pre>';
//print_r($totalApar);
//print_r($countAparTotal);
//exit;
?>
<div class="right_col">
    <div class="page-title">
        <div class="title_left">
            <h3>Employee SR/LR/APAR/Attachment Report</h3>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12 col-sm-12 col-xs-12">
            <div class="x_panel">
                <div class="x_title">
                    <h2>Employee SR/LR/APAR/Attachment Report</h2>
                    <div class="clearfix"></div>
                </div>
                <div class="x_content">
                    <div class="col-md-12">&nbsp;</div>
                    <form name="myformlogin" id="myformlogin" action="<?php echo base_url(); ?>user/document_report_filter" method="post">

                        <div class="col-md-3">
                            <label>Department</label>
                            <div class=" nopadding">
                                <select name="department" id="department" class="form-control">
                                    <option value="all" <?php if ($selecteddep == 'all') {
                                        echo 'selected=selected';
                                    } else {
                                        echo '';
                                    } ?>>All Department</option>
                                    <?php foreach ($departmentlist as $dep) { ?>
                                        <option value="<?php echo $dep->id ?>" <?php if ($selecteddep == $dep->id) {
                                            echo 'selected=selected';
                                        } else {
                                            echo '';
                                        } ?>><?php echo $dep->name; ?></option>
                                    <?php } ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-1 nopadding">
                            <div class="col-md-12 nopadding">
                                &nbsp;<input type="submit" name="search" class="btn btn-success" style="margin-top:14%;" id="search" value="Search" />
                            </div>
                        </div>
                        <div class="col-md-8">
                            <table class="table table-bordered">
                                <tr>
                                    <th></th>
                                    <th>SR</th>
                                    <th>LR</th>
                                    <th>Attachement</th>
                                    <th>APAR</th>
                                </tr>
                                <tr>
                                    <th></th>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td>
                                        <table class="table table-bordered" style="margin: 0px">
                                            <tr>
												<?php 
													$TotalYr = $this->User_model->GetUploadAllActive();
													$i = 1;
												?>
												<?php foreach ($TotalYr as $row) { ?>
                                                <th><?php echo $row->startdate; ?></th>
												<?php
													if($i == 5){
														break;
													}
													$i++;
												?>
                                                <?php } ?>
												<?php  /* foreach ($totalApar as $key => $value) { ?>
                                                <th><?php echo $key; ?></th>
                                                <?php }*/ ?>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Count of Records</th>
                                    <td>
										<?php
											$numSRGR = $this->User_model->GetSrAllActiveGroupByID();
											echo $numSRGR;
											//echo $srCount[0]->sr_count ? $srCount[0]->sr_count : '0'; 
											//GetSrAllActiveGroupByID
										?> 
									</td>
                                    <td>
									<?php
										$numLRGR = $this->User_model->GetLrAllActiveGroupByID();
										echo $numLRGR;
										//echo $lrCount[0]->lr_count ? $lrCount[0]->lr_count : '0'; 
									?> 
									</td>
                                    <td><?php 
										$numATTGR = $this->User_model->GetAttAllActiveGroupByID();
										echo $numATTGR;
									//echo $attachCount[0]->attach_count ? $attachCount[0]->attach_count : '0'; ?></td>
                                    <td>
                                        <table class="table table-bordered" style="margin: 0px">
                                            <tr>
                                                <?php /* foreach ($countAparTotal as $key => $value) { ?>
                                                <th class="cell_width"><?php echo $value; ?></th>
                                                <?php }*/ ?>
												
												<?php 
												$j = 1;
												foreach ($TotalYr as $row) { ?>
                                                <th>
												<?php  
													$UploadAllActiveByStartGR = $this->User_model->GetUploadAllActiveByStartGR($row->startdate);
													
													echo count($UploadAllActiveByStartGR);
												?>
												<?php
												if($j == 5){
													break;
												}
												$j++;
												?>
												</th>
                                                <?php } ?>
												
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Total Pages</th>
                                    <td>
									<?php 										
										$numSR = $this->User_model->GetSrAllActive();
										echo $numSR;
										//echo $srSummary[0]->sr_count ? $srSummary[0]->sr_count : '0'; 
									?>
									</td>
                                    <td><?php									 
										$numLR = $this->User_model->GetLrAllActive();
										echo $numLR;
									//echo $lrSummary[0]->lr_count ? $lrSummary[0]->lr_count : '0'; ?></td>
                                    <td><?php 
										$numATT = $this->User_model->GetAttAllActive();
										echo $numATT;
									//echo $attachmentSummary[0]->attach_count ? $attachmentSummary[0]->attach_count : '0'; ?></td>
                                    <td>
                                        <table class="table table-bordered" style="margin: 0px">
                                            <tr>
											
												<?php 
													$k = 1;
												foreach ($TotalYr as $row) { ?>
                                                <th><?php 
													
													$UploadAllActiveByStart = $this->User_model->GetUploadAllActiveByStart($row->startdate);													
														echo $UploadAllActiveByStart->countFile;
													?>
												</th>
													<?php
													if($k == 5){
														break;
													}
													$k++;
													?>
                                                <?php } ?>
                                                <?php  /*foreach ($totalApar as $key => $value) { ?>
                                                <th class="cell_width"><?php echo $value; ?></th>
                                                <?php }*/ ?>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </form>

                    <div class="col-md-12">&nbsp;</div>
                    <div class="col-md-12">
                        <?php
                        if (isset($selecteddepsearch)) {
                            $seldepart = $selecteddepsearch;
                        } else {
                            $seldepart = 'all';
                        }

                        if (isset($startdate)) {
                            $startdate = $startdate;
                        } else {
                            $startdate = date("Y-m-d", strtotime("-6 months"));
                        }
                        if (isset($enddate)) {
                            $enddate = $enddate;
                        } else {
                            $enddate = date("Y-m-d");
                        }
                        ?>
                        <a href="<?php echo base_url(); ?>user/getEmployeeExcelFile/<?php echo $seldepart; ?>">Excel Report</a>
                    </div>
                    <div class="col-md-12">&nbsp;</div>
                                <?php if (!empty($Report)) { ?>
                        <table id="example" class="table table-striped table-bordered" style="width:100%">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Employee Name / DOB</th>
                                    <th>Pf. No.</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>SR</th>
                                    <th>LR</th>
                                <?php
								$current_year = date("Y");
                                /* $current_year = date("Y");
                                for ($i = $current_year; $i > $current_year - 5; $i--) { ?>
                                        <th>APAR -> <?php echo $i; ?></th>
                                <?php } */ 
								?>
								<?php 
											$TotalYr = $this->User_model->GetUploadAllActive();
											$i = 1;
										?>
										<?php foreach ($TotalYr as $row) { ?>
										<?php
											echo '<th>APAR ->'.$row->startdate.'</th>';
										
											if($i == 5){
												break;
											}
											$i++;
										?>
										<?php } ?>
                                    <th>Attachment</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $i = 1;
                                foreach ($Report as $reportEmployee) {
									
									//print_r($reportEmployee);
									//exit;
									
									
                                	$fathername = '';
				                	$dob = 'NOT AVAILABLE';
				                	$fathername = $reportEmployee->fathername;
				                	if($fathername){
				                		$fathername = ' S/O '.$fathername;  
													}
                                	if(!empty($reportEmployee->dob)) {
										$dob = date('d M Y',strtotime($reportEmployee->dob));
									}
                                    $reportEmployee1 = $this->User_model->get_employee_document_data($reportEmployee->emp_id);
                                    $year = [];
                                    for ($c = $current_year; $c > $current_year - 5; $c--) {
                                        $year[$c] = 0;
                                    }
                                    $aparData = $reportEmployee1->apar;
                                    if (!empty($aparData)) {
                                        $apar_year_wise = explode(' ', $aparData);
                                        if (!empty($apar_year_wise)) {
                                            foreach ($apar_year_wise as $key => $value) {
                                                # code...
                                                $explodedYearApar = explode('->', $value);
                                                // print_r('<pre>');
                                                // print_r($explodedYearApar);
                                                if (count($explodedYearApar) > 1) {
                                                    $year[$explodedYearApar[0]] = $explodedYearApar[1];
                                                }
                                            }
                                        }
                                    }
                                    $department = $this->User_model->getDepartmentNamebyID($reportEmployee->emp_department);
                                    $designation = $this->User_model->getDesignationNamebyID($reportEmployee->emp_designation);
                                    //print_r($department);
                                    $empname = $reportEmployee->employee_name;
                                    if (isset($department)) {
                                        $department_name = $department[0]->name;
                                        $designation_name = $designation[0]->name;
                                    } else {
                                        $department_name = '';
                                        $designation_name = '';
                                    }

                                    $srcount = $this->User_model->getEmployeeSRcount($reportEmployee->emp_id);
                                    $lrcount = $this->User_model->getEmployeeLRcount($reportEmployee->emp_id);
                                    $attachmentcount = $this->User_model->getEmployeeAttachmentcount($reportEmployee->emp_id);
                                    $aparcount = $this->User_model->getEmployeeAparcount($reportEmployee->emp_id);
                                    ?>
                                    <tr>
                                        <td><?php echo ++$page;?></td>
                                        <td><?php echo $empname.$fathername ?> / <?php echo $dob ?></td>
                                        <!--<td><?php // echo $reportEmployee->employee_code; ?></td>-->
                                        <!--by Preeti- 29-07-2019-->
                                        <td><a href="<?php echo base_url() . 'user/search_employee/' . $reportEmployee->employee_code; ?>" title="View Detail"><?php echo $reportEmployee->employee_code; ?></a></td>
                                        <td><?php echo $department_name; ?></td>
                                        <td><?php echo $designation_name; ?></td>
                                        <td><?php 
											echo count($this->User_model->GetUserSrByEmpID($reportEmployee->emp_id));
										//echo $srcount;
										?></td>
                                        <td><?php 
										echo count($this->User_model->GetUserLrByEmpID($reportEmployee->emp_id));
										//echo $lrcount; ?></td>
										
										<?php 
											$TotalYr = $this->User_model->GetUploadAllActive();
											$i = 1;
										?>
										<?php foreach ($TotalYr as $row) { ?>
										 <td>
										<?php
											echo count($this->User_model->GetUploadByEmpIdAllActive($row->startdate,$reportEmployee->emp_id));
										
											if($i == 5){
												break;
											}
											$i++;
										?>
										</td>
										<?php } ?>
										
										
                                        <?php /* foreach ($year as $key => $valueApar) { ?>
                                            <td><?php echo $valueApar; ?></td>
                                        <?php }*/  ?>
                                                <!-- <td><?php /* if (!empty($aparcount)) {
                                    foreach ($aparcount as $countapar) {
                                        echo $countapar->startdate . '->' . $countapar->totalemployee_codecount;
                                    }
                                } else {
                                    echo '0';
                                } */ ?></td> -->
                                        <td><?php echo $attachmentcount; ?></td>
                                    </tr>
                            <?php $i++;
                        } ?>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Employee Name / DOB</th>
                                    <th>Pf. No.</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>SR</th>
                                    <th>LR</th>
									<?php 
											$TotalYr = $this->User_model->GetUploadAllActive();
											$i = 1;
										?>
										<?php foreach ($TotalYr as $row) { ?>
										<?php
											echo '<th>APAR ->'.$row->startdate.'</th>';
										
											if($i == 5){
												break;
											}
											$i++;
										?>
										<?php } ?>
                                        <?php /*
                                        $current_year = date("Y");
                                        for ($i = $current_year; $i > $current_year - 5; $i--) {
                                            ?>
                                        <th>APAR -> <?php echo $i; ?></th>
                                    <?php } */?>
                                    <th>Attachment</th>
                                </tr>
                            </tfoot>
                        </table>
                        <div class="col-md-6">
                            <div class="pagination"><?php echo $links; ?></div>
                        </div>
                        <div class="col-md-6">
                                <span class="pull-right" style="margin-top: 25px;">Showing <?= count($Report) ?> of <?= $total_rows ?> records</span>
                        </div>
                        <?php } else { ?>
                        <p>No record found.</p>
                        <?php } ?>
                </div>
            </div>
        </div>
    </div>
</div>