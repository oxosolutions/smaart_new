'use strict'

angular.module('smaart.surveyListCTRL', ['ngCordova'])
.filter('htmlToPlaintext', function() {
    return function(text) {
      	return  text ? String(text).replace(/<[^>]+>/gm, '') : '';
    };
  })
.controller('surveyListCTRL', function($scope, $ionicLoading, localStorageService, $state, $ionicPopup, appData, appActivation, dbservice){
	
	
	$scope.startSurvey = function(surveyid){
		console.log(surveyid)
  		localStorageService.set('finishedGroups',undefined);
  		localStorageService.set('completedGroups',undefined);
  		localStorageService.set('ContinueKey',undefined);
  		localStorageService.set('RuningSurvey',null);
  		localStorageService.set('record_id',null);
  		window.currentTimeStamp = null;
  		window.surveyStatus = 'new';
  		$state.go('app.surveyGroup',{id:surveyid});
  	}
  	
	
	$scope.roleView = 'true';
		$scope.notAuth = 'false';
		$scope.detailActivate = 'true';
	var getSurveys = 'SELECT * FROM survey_data';
	var surveyList = {};
	dbservice.runQuery(getSurveys,[],function(res){
		var totalGroupd = 0;
		for(var i=0; i < res.rows.length; i++) {
			var item = res.rows.item(i);
			var tempArray = {};
			tempArray['name'] = item.name;
			tempArray['description'] = item.description;
			tempArray['id'] = item.survey_id;
			surveyList[item.survey_id] = tempArray;
		}
      	$scope.list = surveyList;
	});
	$scope.survey = {};
	$scope.totalSections = function(surveyid){
		$scope.survey['sectionCount'] = {};
		var countSectionQuery = 'SELECT count(*) as count FROM survey_sections WHERE survey_id = ?';
		dbservice.runQuery(countSectionQuery,[surveyid],function(res){
			$scope.survey['sectionCount'][surveyid] = res.rows.item(0).count;
		});
	}

	$scope.totalQuestions = function(surveyid){
		$scope.survey['questionCount'] = {};
		var countQuestionQuery = 'SELECT count(*) as count FROM survey_questions WHERE survey_id = ?';
		dbservice.runQuery(countQuestionQuery,[surveyid.toString()],function(res){
			$scope.survey['questionCount'][surveyid] = res.rows.item(0).count;
		});
	}

	$scope.gotoSurvey = function(surveyID){
		$state.go('app.survey',{'surveyId': surveyID+1});
	}
	$scope.reActive = function(){
		if(window.Connection) {
	      	if(navigator.connection.type == Connection.NONE) {
	        	$ionicPopup.confirm({
	          		title: 'No Internet Connection',
	          		content: 'Sorry, no Internet connectivity detected. Please reconnect and try again.'
	        	}).then(function(result) {
	         		return false; 		
	        	});
	        	return false;
	      	}
	    }

    	var confirmPopup = $ionicPopup.confirm({
	     title: 'Update App',
	     template: 'Are you sure to update your app?',
	     cancelText: 'No',
         okText: 'Yes'
	   });

	   confirmPopup.then(function(res) {
	     if(res) {
	       $scope.data = {};

		      // An elaborate, custom popup
		      var myPopup = $ionicPopup.show({
		        templateUrl: 'templates/activation-dialog.html',
		        title: 'Enter Activation Code',
		        subTitle: 'Contact Admin for this code',
		        scope: $scope,
		        buttons: [
		          { text: 'Cancel' },
		          {
		            text: '<b>Activate</b>',
		            type: 'button-positive',
		            onTap: function(e) {
		              if (!$scope.data.wifi) {
		                $ionicLoading.show({
		                  template: 'Please fill answer!',
		                  noBackdrop: false,
		                  duration: 1000
		                });
		                e.preventDefault();
		              } else {
		                var formData = new FormData;
		                formData.append('activation_key',$scope.data.wifi);
		                $ionicLoading.show({
		                      template: '<ion-spinner class="spinner-energized"></ion-spinner>',
		                      noBackdrop: false
		                     
		                    });
		                appActivation.appActivate(formData).then(function(res){
		                    
		                    if(res.data.status == 'error'){
		                      $ionicLoading.show({
		                        template: 'invalid Activation code',
		                        noBackdrop: false,
		                        duration: 1000
		                      });
		                      $ionicLoading.hide();
		                    }else{
		                    	var questionsColumn = '';
			                    var insertQuestionMark = '';
			                    var insertColumnsName = '';
		                    	var questionsList = res.data.questions;
			                    var users = res.data.users;
			                    var surveys = res.data.surveys;
			                    var surveySections = res.data.groups;
		                    	var timeStamp = Math.floor(Date.now() / 1000);
		                    	angular.forEach(res.data.questions[0], function(value, key){
			                          if(key != 'created_at' && key != 'updated_at' && key != 'deleted_at'){
			                              questionsColumn += key+' text, ';
			                              insertQuestionMark += '?,';
			                              insertColumnsName += key+', ';
			                          }
			                      });

			                      questionsColumn = questionsColumn.replace(/,\s*$/, "");
			                      insertQuestionMark = insertQuestionMark.replace(/,\s*$/, "");
			                      insertColumnsName = insertColumnsName.replace(/,\s*$/, "");

		                    	angular.forEach(res.data.surveys, function(value, key){
			                          var surveyQuestions = $.grep(res.data.questions, function(grepValue){
			                              return grepValue.survey_id == value.id;
			                          });
			                          var surveyResulColumns = '';
			                          angular.forEach(surveyQuestions, function(value){
			                              surveyResulColumns += value.question_key+ ' text, ';
			                          });
			                          var check_if_table_exist = "SELECT name FROM sqlite_master WHERE type='table' AND name='survey_result_"+value.id+"'";
			                          dbservice.runQuery(check_if_table_exist,[],function(res) {
			                            if(res.rows.length != 0){
			                            	var rename_table = 'ALTER TABLE survey_result_'+value.id+' RENAME TO survey_result_'+value.id+'_'+timeStamp+'_bak';
			                            	dbservice.runQuery(rename_table,[], function(res){
			                            		console.log('survey_result_'+value.id+' table renamed to survey_result_'+value.id+'_'+timeStamp+'_bak');
			                            		var Query = 'CREATE TABLE IF NOT EXISTS survey_result_'+value.id+'(id integer primary key,'+surveyResulColumns+' ip_address text, survey_started_on text, survey_completed_on text, survey_submitted_by text, survey_submitted_from text, mac_address text, imei text, unique_id text, device_detail text, created_by text, created_at text, last_field_id integer, last_group_id integer, completed_groups text, survey_status text, incomplete_name text)'
					                            dbservice.runQuery(Query,[],function(res) {
					                            	$ionicLoading.hide();
					                            	$ionicLoading.show({
								                        template: 'Activated Successfully',
								                        noBackdrop: false,
								                        duration: 1000
								                      });
								                      $state.go('login');
					                              console.log("table created ");
					                            }, function (err) {
					                              console.log(err);
					                            });
			                            	},function(err){
			                            		console.log(err);
			                            	});
			                            }else{
			                            	var Query = 'CREATE TABLE IF NOT EXISTS survey_result_'+value.id+'(id integer primary key,'+surveyResulColumns+' ip_address text, survey_started_on text, survey_completed_on text, survey_submitted_by text, survey_submitted_from text, mac_address text, imei text, unique_id text, device_detail text, created_by text, created_at text, last_field_id integer, last_group_id integer, completed_groups text, survey_status text, incomplete_name text)'
				                            dbservice.runQuery(Query,[],function(res) {
				                              console.log("table created ");
				                            }, function (err) {
				                              console.log(err);
				                            });
			                            }
			                          }, function (err) {
			                            console.log(err);
			                          });
			                      });
		                    	var dropArray = [
			                            'DROP TABLE IF EXISTS survey_data',
			                            'DROP TABLE IF EXISTS survey_questions',
			                            'DROP TABLE IF EXISTS survey_sections',
			                            'DROP TABLE IF EXISTS users',
			                        ];
			                      angular.forEach(dropArray, function(val,key){
			                          dbservice.runQuery(val, [], function(res){
			                              console.log(val+' table dropped!');
			                          }, function(err){
			                              console.log(err);
			                          });
			                      });


			                   //create user table if not exists
								var createUserTable = 'CREATE TABLE IF NOT EXISTS users(id integer primary key, name text, email text, api_token text, created_at text, updated_at text, role_id integer, organization_id integer, approved integer, app_password text)';
								dbservice.runQuery(createUserTable,[],function(userResp){
									angular.forEach(users, function(v,k){
										var insertUser = 'INSERT INTO users(name, email, api_token, created_at, updated_at, role_id, organization_id, approved, app_password) VALUES(?,?,?,?,?,?,?,?,?)';
		                                    dbservice.runQuery(insertUser,[
		                                    v.name,v.email,v.api_token,v.created_at,v.updated_at,v.role_id,v.organization_id,v.approved,v.app_password], function(res){

											},function(error){
												console.log(error);
											});
									});
								});
								//end user table create
								
								//create question table table if not exists
									var createQuestionTable = 'CREATE TABLE IF NOT EXISTS survey_questions(id integer primary key,'+questionsColumn+')';
									dbservice.runQuery(createQuestionTable,[],function(res){
										angular.forEach(questionsList, function(question, k){
											var dataArray = [];
		                                      angular.forEach(question, function(val, key){
		                                          if(key != 'created_at' && key != 'updated_at' && key != 'deleted_at'){
		                                              if(key == 'answers'){
		                                                dataArray.push(JSON.stringify(val));
		                                              }else{
		                                                try{
		                                                  dataArray.push(val.toString());
		                                                }catch(e){
		                                                  dataArray.push(val);
		                                                }
		                                              }
		                                          }
		                                      });
		                                      var insertQuestion = 'INSERT INTO survey_questions('+insertColumnsName+') VALUES('+insertQuestionMark+')';
												dbservice.runQuery(insertQuestion,dataArray, function(res){

												},function(error){
													console.log(error);
												});
										});
									},function(error){
										console.log(error);
									});
								//end question table create
								
								//create survey data 
									var createSurveyDatatable = 'CREATE TABLE IF NOT EXISTS survey_data(id integer primary key , survey_id integer, survey_table text, name text, created_by integer, description text, status integer)';
		                            dbservice.runQuery(createSurveyDatatable,[],function(res){
			                        	angular.forEach(surveys, function(val, key){
		                                    var insertSurveyData = 'INSERT INTO survey_data(survey_id, survey_table, name, created_by, description, status) VALUES(?,?,?,?,?,?)';
		                                    dbservice.runQuery(insertSurveyData,[val.id, val.survey_table, val.name, val.created_by, val.description, val.status], function(res){

		                                      },function (error) {
		                                      	console.log(error);
		                                      });
		                                });
		                            },function (error) {
		                            	console.log(error);
		                            });	
		                        //end create survey data

			                  //create section
	                       		var createSectionsTable = 'CREATE TABLE IF NOT EXISTS survey_sections(id integer primary key, group_id integer, survey_id integer, title text, description text, group_order integer)';
								dbservice.runQuery(createSectionsTable, [], function(res){
									angular.forEach(surveySections, function(val, key){
	                                    var insertSectionsData = 'INSERT INTO survey_sections(group_id, survey_id, title, description, group_order) VALUES(?,?,?,?,?)';
	                                    dbservice.runQuery(insertSectionsData,[parseInt(val.id), parseInt(val.survey_id), val.title, val.description, val.group_order], function(res){
											
										},function(error){
											console.log(error);
										});
									});
								},function(error){
									console.log(error);
								});
	                        //end sections
	                        
	                        
		                      localStorageService.set('ActivationCode',$scope.data.wifi);

		                      if(res.data.media != 'null'){

		                        angular.forEach(res.data.media, function(mediaLink, mediaKey){

		                            var fileSplited = mediaLink.split('/');
		                            var fileLength = fileSplited.length;
		                            var fileName = fileSplited[fileLength-1];

		                            console.log(fileName);
		                            console.log(mediaLink);

		                            var downloadUrl = mediaLink;
		                            var relativeFilePath = fileName;  // using an absolute path also does not work
		                            document.addEventListener("deviceready", function() {
		                            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
		                               fileSystem.root.getDirectory("SmaartMedia", {create: true, exclusive: false});
		                               var fileTransfer = new FileTransfer();
		                               fileTransfer.download(
		                                  downloadUrl,

		                                  // The correct path!
		                                  fileSystem.root.toURL() + 'SmaartMedia/' + relativeFilePath,

		                                  function (entry) {
		                                     /*alert("Success");*/
		                                  },
		                                  function (error) {
		                                     alert("Error during download. Code = " + error.code);
		                                  }
		                               );
		                            });
		                          }, false);
		                        });
		                      }

		                      
		                    }
		                    
		                });
		                
		              }
		            }
		          }
		        ]
		      });
	     } else {
	       console.log('You selected no!');
	     }
	   });
    }


})

.controller('stopSurvey', function($scope, $rootScope, $ionicLoading, localStorageService, $state, AppConfig, ionicDatePicker, $ionicPopup, dbservice){

	$scope.StopSurvey = function(currentIndex){
		var myPopup = $ionicPopup.show({
	     template: '<input type = "text" ng-model = "stopSurvey" style="color:#000 !important;">',
	     title: 'Enter Incomplete Survey Name',
	     subTitle: 'Enter name for your incomplete survey',
	     scope: $scope,
			
	     buttons: [
	        { text: 'Cancel' }, {
	           text: '<b>Save</b>',
	           type: 'button-positive',
	              onTap: function(e) {
	                 if (!$scope.$$childHead.stopSurvey) {
	                    //don't allow the user to close unless he enters model...
	                       e.preventDefault();
	                 } else {
	                    return $scope.$$childHead.stopSurvey;
	                 }
	              }
	        }
	     ]
      });

      myPopup.then(function(res) {
      	 if(res != undefined){
      	 	var record_id = localStorageService.get('record_id');
      	 	var Query = 'UPDATE survey_result_'+$state.params.surveyid+' SET incomplete_name = ?, last_field_id = ? WHERE id = ?';
      	 	dbservice.runQuery(Query,[res, currentIndex, record_id],function(res) {
              console.log("name updated");
              $state.go('app.dashboard');
            }, function (err) {
              console.log(err);
            });
      	 }else{
      	 	console.log('You clicked cancel');
      	 }
      });  
	}
})
.controller('incompleteSurveyCTLR', function($scope, $ionicLoading, localStorageService, $state, dbservice){

	localStorageService.set('RuningSurvey',null);
	var getSurveys = 'SELECT * FROM survey_data';
	dbservice.runQuery(getSurveys,[], function(res){
		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	var SurveyData = row;
		var SurveyListSelect = [];
		angular.forEach(SurveyData, function(value, key){
			var tempArray = {};
			tempArray['name'] = value.name;
			tempArray['description'] = value.description;
			tempArray['id'] = value.survey_id;
			SurveyListSelect.push(tempArray);
		});
		$scope.list = SurveyListSelect;
	});
	$scope.surveyData = {};
	$scope.incompleteCount = function(surveyid){
		$scope.setSurveyID = surveyid;
		$scope.surveyData['incomplete'] = {};
		var couuntQuery = 'SELECT count(*) as count FROM survey_result_'+surveyid+' WHERE survey_status = ?';
		dbservice.runQuery(couuntQuery,['incomplete'], function(res){
			$scope.surveyData['incomplete'][surveyid] = res.rows.item(0).count;
		});
	}

	$scope.startCont = function(recordId, SurveyID){
		var Query = 'SELECT last_field_id, last_group_id, completed_groups FROM survey_result_'+SurveyID+' WHERE id = ?';
		dbservice.runQuery(Query,[recordId],function(res) {	
			var lastIds = res.rows.item(0);
			localStorageService.set('completedGroups',JSON.parse(res.rows.item(0).completed_groups));
			localStorageService.set('record_id',recordId);
			localStorageService.set('lastquestId',lastIds.last_field_id);
			$state.go('app.survey',{'surveyid':SurveyID});
			/*if(lastIds.last_group_id != null && lastIds.last_group_id != ''){
				$state.go('app.survey',{'surveyId':SurveyID, 'QuestId': lastIds.last_field_id+1, 'groupId': lastIds.last_group_id});
			}else{
				$state.go('app.surveyGroup',{id:SurveyID});
			}*/
        }, function (err) {
          console.log(err);
        });		
	}

	$scope.showIncomplete = function(surveyid){
		var sendArrayList = {};
		var SurveyID = $scope.$$childTail.surveySelect;
		var Query = 'SELECT * FROM survey_result_'+surveyid+' WHERE survey_status = ?';
		dbservice.runQuery(Query,['incomplete'],function(res) {	
			var row = {};
			for(var i=0; i<res.rows.length; i++) {
	            row[i] = res.rows.item(i)
	        }		
			$scope.PendingSurvey = row;
        }, function (err) {
          console.log(err);
        });
	}



})


.controller('CompleteSurveyCTLR', function($scope,$rootScope, $ionicLoading, localStorageService, $state, exportS, $ionicPopup, $cordovaDevice, dbservice){
	
	$scope.surveyChange = function(surveyid){
		$scope.selectedSurvey = surveyid;
		var sendArrayList = {};
		var Query = 'SELECT id, incomplete_name, survey_started_on FROM survey_result_'+surveyid+' WHERE survey_status = ?';
		dbservice.runQuery(Query,['completed'],function(res) {	
			console.log(res);
			var row = {};
			for(var i=0; i<res.rows.length; i++) {
	            row[i] = res.rows.item(i)
	        }		
			$scope.PendingSurvey = row;
        }, function (err) {
          console.log(err);
        });
        //console.log('tst');
	}

	var getSurveys = 'SELECT * FROM survey_data';
	dbservice.runQuery(getSurveys,[], function(res){
		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	var SurveyData = row;
      	$scope.list = row;
		var SurveyListSelect = {};
		angular.forEach(SurveyData, function(value, key){
			
			SurveyListSelect[value.survey_id] = value.name;
		});
		// $scope.list = SurveyListSelect;
	});



	$scope.exportSurv = function(){
		if($scope.selectedSurvey == undefined){
			$ionicLoading.show({
		      template: 'Please select the survey!',
		      noBackdrop: false,
		      duration: 2000
		    });
		}
		/*if(window.Connection) {
	      	if(navigator.connection.type == Connection.NONE) {
	        	$ionicPopup.confirm({
	          		title: 'No Internet Connection',
	          		content: 'Sorry, no Internet connectivity detected. Please reconnect and try again.'
	        	}).then(function(result) {
	          		
	        	});
	      	}else{*/
	      		var Query = 'SELECT * from survey_result_'+$scope.selectedSurvey;
				dbservice.runQuery(Query,[],function(res) {	
					if(res.rows.length == 0){
						$ionicLoading.show({
					      template: 'No Survey Result Available!',
					      noBackdrop: false,
					      duration: 2000
					    });
					}else{
						var myPopup = $ionicPopup.show({
						    template: '<ul style="margin-left:20px"><li><label style:font-size:15px><input type="radio" style="float:left;width:20px;" name="expSurvey" value="0" ng-model="surveyExport">&nbsp;&nbsp;Sync All</label></li><li style="margin-top:2%;"><label style:font-size:15px><input value="1" style="float:left;width:20px;" type="radio" name="expSurvey" ng-model="surveyExport">&nbsp;&nbsp;Sync only Un-Synced</label></li></ul>',
						    title: "Which Survey's You Want to Sync",
						    subTitle: 'Please select your option',
						    scope: $scope,
						    buttons: [
						      { text: 'Cancel' },
						      {
						        text: '<b>Sync</b>',
						        type: 'button-positive',
						        onTap: function(e) {
						        	//console.log($scope.$$childTail.surveyExport);
						          if ($scope.$$childTail.surveyExport == undefined) {
						            //don't allow the user to close unless he enters wifi password
						            e.preventDefault();
						          } else {
						            return $scope.$$childTail.surveyExport;
						          }
						        }
						      }
						    ]
						  });
						
						myPopup.then(function(respopup) {
							if(respopup != undefined){
								var row = {};
								for(var i=0; i<res.rows.length; i++) {
						            row[i] = res.rows.item(i)
						            var Query = 'UPDATE survey_result_'+$scope.$$childTail.surveySelect+' SET survey_sync_status = ? WHERE id = ?'
						            dbservice.runQuery(Query,['synced',res.rows.item(i).id],function(res) {	
						            }, function(err){
						            	console.log(err);
						            });
						        }
						        var formData = new FormData;
						        formData.append('survey_data',JSON.stringify(row));
						        formData.append('survey_id',$scope.selectedSurvey);
						        formData.append('activation_code',localStorageService.get('ActivationCode'));
						        formData.append('lat_long',JSON.stringify({lat: window.lat, long: window.long}));
						        exportS.exportSurvey(formData).then(function(result){
						        	console.log(result);
						        	$ionicLoading.show({
								      template: 'Data Successfully Exported!',
								      noBackdrop: false,
								      duration: 2000
								    });
						        });
							}				    			    
						});
					}
					console.log(res.rows.length);
		        }, function (err) {
		          console.log(err);
		        });
	      	/*}
	    }*/
	}
});


function timeStamp(){

	var timestamp = Date.now(),
        date = new Date(timestamp),
        datevalues = [
           date.getFullYear(),
           date.getMonth()+1,
           date.getDate(),
           date.getHours(),
           date.getMinutes(),
           date.getSeconds(),
        ];
    var timeStamp = datevalues[0]+'-'+datevalues[1]+'-'+datevalues[2]+'-'+datevalues[3]+'-'+datevalues[4]+'-'+datevalues[5];

    return timeStamp;
}