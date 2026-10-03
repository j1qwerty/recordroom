<?php ini_set('max_execution_time', 0);
include_once('function.php');

echo $dir = $_SERVER['DOCUMENT_ROOT'].'/bulk/to_be_checked/';
exit;
$firstlevel_Directory = scandir($dir);
$firstlevel_Directory = array_slice($firstlevel_Directory,2);

if(!empty($firstlevel_Directory)){
	foreach($firstlevel_Directory as $fldir){		
		
		$secondlevel_directory = scandir($dir.'/'.$fldir);
		//print_r($secondlevel_directory);
		$secondlevel_directory = array_slice($secondlevel_directory,2);
		foreach($secondlevel_directory as $sldir){
			
			//Check the folder have images
			$path = $dir.'/'.$fldir.'/'.$sldir.'/'; 
			@$files = array_slice(scandir($path),2);
			
			if(!empty($files)){
				$image_list_array = scandir($path);
				$image_list_array = array_slice($image_list_array,2);
				if(!empty($image_list_array)){
					foreach($image_list_array as $image){
						$filesize = filesize($path.$image);
						
						if($filesize <= 512000){
							echo '';
						}elseif($filesize > 512000 && $filesize <= 819200){ //500KB to 800KB 60%
							compress($path.$image, $path.$image, 60);
						}elseif($filesize > 819200 && $filesize <= 1536000){ //500KB to 1.5MB 50%
							compress($path.$image, $path.$image, 50);
						}elseif($filesize > 1536000 && $filesize <= 4194304){ //1.5MB to 4MB 35%
							compress($path.$image, $path.$image, 35);
						}elseif($filesize > 4194304){ //4MB above 25%
							compress($path.$image, $path.$image, 25);
						}else{
							echo '';
						}
					}
				}
				
			}else{
				echo 'No images found.';
				echo '<br>';
			}			
		}		
	}
}else{
	echo 'No folders found.';
}

//echo '<pre>';
//print_r($firstlevel_Directory);

?>