function telnum() {
	
	
}

telnum.prototype.fsave_telnums = function (res, ncli) {
	
	if (!res) return false;
	
	var xContactTel = res.selectNodes("./telnums/rows/row");
	
	var qry=new Array();
	
	// Suppression des données dans ncb_sys_contacts_tel
	qry.push("delete from ncb_sys_contacts_tel where nco in ( SELECT n FROM ncb_sys_contacts WHERE n_sys_contact_pere="+ncli+")");
	
	// Réinsertion
	for (var i = 0; i < xContactTel.length; i++) {
		
		var aContactTel = xmltag2array(xContactTel[i]);
		
		qry.push(insert_qry("ncb_sys_contacts_tel",aContactTel,true));
	}
	
	//odb.query(qry,myobj);
	
	return qry;
}

/*
// Callback appel soap
telnum.prototype.fsync_telnum_clb=function(r,rt,myobj){
	
	if (!r) return false;
	
	var xContactTel = r.selectNodes("./telnums/rows/row");
	var qry=new Array();
	
	// Suppression des données dans ncb_sys_contacts_tel
	qry.push("delete from ncb_sys_contacts_tel where nco in ( SELECT n FROM ncb_sys_contacts WHERE n_sys_contact_pere="+myobj.ncli+")");
	
	// Réinsertion
	for (var i = 0; i < xContactTel.length; i++) {
		
		var aContactTel = xmltag2array(xContactTel[i]);
		
		qry.push(insert_qry("ncb_sys_contacts_tel",aContactTel,true));
	}
	
	odb.query(qry,myobj);
}


// Récupère les numéros de tel
telnum.prototype.fget_tel_type=function(ccontact, contact, callback) {
	
	if (!contact) return;
	
	var qry = "select des, val from ncb_sys_contacts_tel where nco="+contact.n;
	odb.query(qry,ccontact,callback);
}
 */

