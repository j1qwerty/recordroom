<?php /* Copyright (c) 2017 onwards, HashTag Labs Private Limited, India
 *
 * Permission is hereby granted for using of this software code only with written permission
 * from HashTag Labs Private Limited, India or Team HashTag Labs
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package	          VisitorMaps by HashTagLabs India
 * @Team    	      Team HashTag Labs, India
 * @Contributors      Rinki, Ankur, Arun, Akhil, Ajiz, Rahul, Abhishek, Praveen
 * @copyright	      Copyright (c) 2017 onwards - HashTag Labs Private Limited, India
 * @since	          Version 1.0.0 - last released on 07-06-2017
 * @contact           info@hashtaglabs.biz
 * @website           http://www.hashtaglabs.biz
 * @Mobile            +91 9810723836
 * @Skype             contact.praveensharma | abhishar2000
 * @PayPal            http://paypal.me/abhishar
 * @UPI               abhishar@upi
 */ ?>
<?php
class Ang_model extends CI_Model {

    public function __construct() {
        parent::__construct();
       
    }

    public function getUsers()
	{
		$query=$this->db->query("select * from books");
		$rs=$query->result_array();
		return $rs;
		
	}
	
	public function insert($data)
	{
		
		$this->db->insert('books', $data);
		echo $this->db->last_query();
		
	}
	
	public function update($data,$id)
	{
			$this->db->where('id', $id);
			$this->db->update('books', $data);
		
		
	}
	
	public function deletebook($id)
	{
	   $query=$this->db->query("delete from books where id='$id'");	
		
	}
		
}
?>