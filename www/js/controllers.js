'use strict'

angular.module('smaart.controllers', ['ngCordova'])
.directive('input', function() {
  return {
    restrict: 'E',
    require: 'ngModel',
    link: function(scope, $el, attrs, ngModel) {
      if ($el[0].type === 'number') {
      		ngModel.$parsers.push(function(value) {
	          return value.toString();
	        });

	        ngModel.$formatters.push(function(value) {
	          return parseFloat(value, 10);
	        });
      }
    }
  }
})
.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, localStorageService, $ionicLoading) {

    $scope.logout = function(){

      $ionicLoading.show({
        template: '<ion-spinner icon="android"></ion-spinner>',
        noBackdrop: false
      });

      localStorageService.set('userDet',null);
      localStorageService.set('userId',null);
      $state.go('login');
      $ionicLoading.hide();
    }

    $scope.delete = function(){

        localStorageService.set('startStamp','');
        localStorageService.set('SurveyList','');
        localStorageService.set('CurrentSurveyNameID','');
        $ionicLoading.show({
          template: 'Data Deleted Successfully!!',
          noBackdrop: false,
          duration: 1000
        });
    }

    
}).controller('LoginCtrl', function($scope, $ionicLoading, localStorageService, $state, appData, $ionicNavBarDelegate, dbservice){

    $ionicNavBarDelegate.showBackButton(false);

    if(localStorageService.get('ActivationCode') == null){

        //appData.activate();
        $state.go('index');
    }else if(localStorageService.get('userId') != undefined || localStorageService.get('userId') != null){
        $state.go('app.dashboard');
    }

    $scope.data = {email:'', password: ''};
    $scope.doLogin = function(){
        $ionicLoading.show({
              	template: '<ion-spinner icon="android"></ion-spinner>',
              	noBackdrop: false
            });
        var UserEmail = $scope.data.email.trim();
        var UserPass = $scope.data.password.trim();
        
        var errorStatus = false;
        
        if(UserEmail == ''){

            jQuery('input[name=email]').addClass('loginErr');
            errorStatus = true;
        }

        if(UserPass == ''){

            jQuery('input[name=password]').addClass('loginErr');
            errorStatus = true;
        }
        
        if(errorStatus == false){
            jQuery('input[name=password]').removeClass('loginErr');
            jQuery('input[name=email]').removeClass('loginErr');
            $ionicLoading.show({
              template: '<ion-spinner icon="android"></ion-spinner>',
              noBackdrop: false
            });
            
            var checkLogin = 'SELECT * FROM users WHERE email = ? and app_password = ?';
            dbservice.runQuery(checkLogin,[UserEmail, UserPass], function(res){
                if(res.rows.length == 1){
                  var row = {};
                  for(var i=0; i<res.rows.length; i++) {
                      row[i] = res.rows.item(i)
                  } 
                  localStorageService.set('userId',row[0].id);
                  localStorageService.set('userName',row[0].name);
                  localStorageService.set('userRole',row[0].user_role);
                  $ionicLoading.hide();
                  $state.go('app.dashboard');
                  return true;
                }else{
                  $ionicLoading.show({
                    template: 'Wrong user details!',
                    noBackdrop: false, 
                    duration: 2000
                  });
                }
            });            
        }else{

            $ionicLoading.hide();
        }
    }
}).controller('RegisterCtrl',function($scope, $ionicLoading, localStorageService, $state, appData){

    
}).controller('designCtrl',function($scope, $ionicLoading, localStorageService, $state, appData, $ionicPlatform, dbservice, $cordovaDevice, ionicDatePicker, ionicTimePicker){
    $ionicPlatform.registerBackButtonAction(function (event) {
      if($state.current.name=="app.survey"){
        $state.go('app.dashboard');
      }else {
        navigator.app.backHistory();
      }
    }, 100);
    var ipObj1 = {
			      callback: function (val) {  
			        var SelectedDate = new Date(val);
			        $scope.answerData.answer = SelectedDate.getFullYear()+'-'+(SelectedDate.getMonth()+1)+'-'+SelectedDate.getDate();
			      },
			      from: new Date(1990, 1, 1), 
			      to: new Date(2020, 10, 30), 
			      inputDate: new Date(), 
			      mondayFirst: true,
			      closeOnSelect: false,
			      templateType: 'modal'
		    };

	$scope.DatePicker = function(){
		ionicDatePicker.openDatePicker(ipObj1);	
	}
	var ipObj2 = {
	    callback: function (val) {      //Mandatory
	      if (typeof (val) === 'undefined') {
	        console.log('Time not selected');
	      } else {
	        var selectedTime = new Date(val * 1000);
	        $scope.answerData.answer = selectedTime.getUTCHours()+':'+selectedTime.getUTCMinutes();
	        // console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), 'H :', selectedTime.getUTCMinutes(), 'M');
	      }
	    },
	    inputTime: 50400,   //Optional
	    format: 12,         //Optional
	    step: 1,           //Optional
	    setLabel: 'Set'    //Optional
	  };
  
	$scope.timePicker = function(){
		ionicTimePicker.openTimePicker(ipObj2);
	}
    var getGroups = 'SELECT * FROM survey_sections left join survey_questions on survey_sections.group_id = survey_questions.group_id WHERE survey_sections.survey_id = ?';
    dbservice.runQuery(getGroups, [$state.params.surveyid], function(res){
      var row = {};
          for(var i=0; i<res.rows.length; i++) {
              row[i] = res.rows.item(i)
          }
          var sectionsArray = {};
          $.each(row,function(key,value){
            if(sectionsArray[value.group_id] != undefined){
                var questionData = {};
                questionData['question_id'] = value.question_id;
                questionData['question_key'] = value.question_key;
                questionData['question_text'] = value.question_text;
                questionData['section_title'] = value.title;
                sectionsArray[value.group_id]['section_title'] = value.title;
                sectionsArray[value.group_id]['section_id'] = value.group_id;
                sectionsArray[value.group_id]['questions'].push(questionData);
            }else{
                sectionsArray[value.group_id] = {};
                sectionsArray[value.group_id]['questions'] = [];
                var questionData = {};
                questionData['question_id'] = value.question_id;
                questionData['question_key'] = value.question_key;
                questionData['question_text'] = value.question_text;
                questionData['section_title'] = value.title;
                sectionsArray[value.group_id]['section_title'] = value.title;
                sectionsArray[value.group_id]['section_id'] = value.group_id;
                sectionsArray[value.group_id]['questions'].push(questionData);
            }
          });
          $scope.groupList = sectionsArray;
          /*console.log(row);*/
          var lastQuestId = localStorageService.get('lastquestId');
          if(lastQuestId != null){
              var continueId = lastQuestId;
          }else{
              var continueId = 0;
          }
          drawQuestionAndAnswer(row[continueId],row[continueId].question_type);
          $scope.nextIndex = parseInt(continueId)+1;
          $scope.currentIndex = continueId;
          window.row = row;
          existingAnswer(row[0],dbservice,0,localStorageService,function(res, key){
				if(res != false){
					$scope[row[0].question_key] = true;
					$scope.answerData = {};
					if(isNumber(res.rows[0][key])){
						if(row[0].question_type == 'checkbox'){
							$scope.answerData.answerCheckbox = res.rows[0][key];
						}else{
							$scope.answerData.answer = parseInt(res.rows[0][key]);
						}
	    			}else{
	    				if(row[0].question_type == 'checkbox'){
							$scope.answerData.answerCheckbox = res.rows[0][key];
						}else{
							$scope.answerData.answer = res.rows[0][key];
						}
	    			}
				}else{
					$scope.answerData = {};
				}
			});
		    // $scope.answerData = {};
          console.log(row);
    }, function(error){
      console.log(error);
    });
    // localStorageService.set('record_id',null);

    $scope.next = function(nextIndex, currentIndex){
    	if(row[nextIndex] == undefined){
    		console.log('finish');
    		finishSurvey(localStorageService,row[0]);
    		$state.go('app.dashboard');
    	}
    	if(row[currentIndex].question_type == 'repeater'){
    		var answerObject = [];
			$('.repeaterRow').each(function(i){
				var questionsObjectArray = {};
				$(this).find('.repeater_field').each(function(j){
					questionsObjectArray[$(this).find('.textBoxSurvey').attr('key')] = $(this).find('select,input').val();
				});
				answerObject.push(questionsObjectArray);
			});
			var answerData = JSON.stringify(answerObject);
    	}else{
    		if(row[currentIndex].question_type == 'checkbox'){
	    		var answerData = JSON.stringify($scope.answerData.answerCheckbox);
	    	}else{
	    		var answerData = $scope.answerData.answer;
	    	}
    	}
    	$scope.answerData.answer = '';
    	existingAnswer(row[nextIndex],dbservice,nextIndex,localStorageService,function(res,key){
    		if(res != false){
          		$scope.answerData = {};
				if(isNumber(res.rows[0][key])){
    				$scope.answerData['answer'] = '';
	    			$scope.answerData['answer'] = parseInt(res.rows[0][key]);
    			}else{
    				$scope.answerData['answer'] = '';
	    			$scope.answerData['answer'] = res.rows[0][key];
    			}
    		}else{
    			$scope.answerData = {};
    		}
    	});
    	$scope.nextIndex = nextIndex;
    	if(row[currentIndex].group_id != row[nextIndex].group_id){
    		$ionicLoading.show({
		      template: 'Section Completed!',
		      noBackdrop: false,
		      duration: 1000
		    });
    	}
    	$scope[row[currentIndex].question_key] = true;
    	saveResult(row[currentIndex], localStorageService, dbservice, answerData, $cordovaDevice, currentIndex);
    	$scope.currentIndex = nextIndex;
    	drawQuestionAndAnswer(row[nextIndex],row[nextIndex].question_type);
    }
    $scope.prev = function(prevIndex){
    	console.log(prevIndex);
    	if(prevIndex != -1){
    		existingAnswer(row[prevIndex],dbservice,prevIndex,localStorageService,function(res,key){
	    		if(res != false){
	    			$scope.answerData = {};
	    			$scope.answerData.answer = '';
	    			if(isNumber(res.rows[0][key])){
	    				$scope.answerData['answer'] = null;
	    				$scope.answerData['answer'] = parseInt(res.rows[0][key]);
	    			}else{
	    				$scope.answerData['answer'] = null;
	    				$scope.answerData['answer'] = res.rows[0][key];
	    			}
	    		}else{
	    			$scope.answerData = {};
	    		}
	    	});
    		$scope.nextIndex = prevIndex;
    		$scope.currentIndex = prevIndex;
    		drawQuestionAndAnswer(row[prevIndex],row[prevIndex].question_type);
    	}
    }

    $scope.setNext = function(questionKey){
    	if(questionKey != ''){
    		var question = $.grep(Object.keys(row), function(k){
				return row[k].question_key == questionKey;
			});
			if(question.length != 0){
				$scope.nextIndex = parseInt(question[0]) - 1;
			}
    	}
    }

    $scope.templateUrl = function(type,answers,key){
		$scope.selectOptions = answers;
		$scope.data = {
			answer: key
		}
		return "surveyTemplate/repeater/"+type+".html";
	}
	
	$scope.createClone = function(){
		var cloneRow = $('.repeaterRow:last').clone();
		$('.repeater').append(cloneRow);
		$('.repeaterRow:last').find('select,input').val('');
	}

    $(document).on('click','.show-ques', function() {
        $(this).parent().toggleClass('active');
        $(this).parent().siblings().removeClass('active');
    });

    function isNumber(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}

    function drawQuestionAndAnswer(questionData, questionType){
    	if(questionType == 'repeater'){
    		var fields = JSON.parse(questionData.fields);
    		$scope.fieldsList = fields;
    	}

    	$scope.QuesHtml = "<p>"+questionData.question_text+"</p>";
		$scope.DescHtml = "<p>"+questionData.question_desc+"</p>";
		$scope.radioOptions = JSON.parse(questionData.answers)[0];
		console.log($scope.radioOptions);
		$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/"+questionType+".html'\"></div>";
    }

    function existingAnswer(questionData, dbservice, currentIndex, localStorageService, callback){
    	var record_id = localStorageService.get('record_id');
    	if(record_id != null){
    		var Query = 'SELECT '+questionData.question_key+' FROM survey_result_'+questionData.survey_id+' WHERE id = ?';
	    	dbservice.runQuery(Query,[record_id], function(res){
	    		callback(res,questionData.question_key);
	    	}, function(error){
	    		console.log(error);
	    	});
    	}else{
    		callback(false);
    	}
    }

    function finishSurvey(localStorageService, questionData){
    	var record_id = localStorageService.get('record_id');
    	var Query = 'UPDATE survey_result_'+questionData.survey_id+' set survey_status = ? WHERE id = ?';
		dbservice.runQuery(Query,['completed',record_id],function(res) {
	          console.log("finish survey ");
        }, function (err) {
          console.log(err);
        });
    }

    function saveResult(questionData, localStorage, dbservice, answer, $cordovaDevice, QuestionIndex){
		var record_id = localStorage.get('record_id');
		if(record_id != null){
			//update with where clause
			var Query = 'UPDATE survey_result_'+questionData.survey_id+' set '+questionData.question_key+' = ?, last_field_id = ?, last_group_id = ? WHERE id = ?';
			dbservice.runQuery(Query,[answer,QuestionIndex,questionData.group_id,record_id],function(res) {
		          console.log("record updated ");
	        }, function (err) {
	          console.log(err);
	        });
		}else{
			//insert new record
			var dateForUnique = new Date(Date.now());
      var dt = new Date;
      var startedTime = dt.getFullYear()+''+(dt.getMonth()+1)+''+dt.getDay()+''+dt.getHours()+''+dt.getMinutes()+''+dt.getSeconds()+''+dt.getMilliseconds();
			var uniqueKey = questionData.survey_id+''+dateForUnique.getFullYear()+''+(dateForUnique.getMonth()+1)+''+dateForUnique.getDay()+''+dateForUnique.getHours()+''+dateForUnique.getMinutes()+''+dateForUnique.getSeconds()+''+dateForUnique.getMilliseconds()+''+Math.floor(Math.random() * 10000000);
			var Query = 'INSERT INTO survey_result_'+questionData.survey_id+'('+questionData.question_key+', survey_started_on, survey_submitted_by, survey_submitted_from, imei, unique_id, device_detail, created_by, created_at, last_field_id, survey_status, last_group_id, incomplete_name) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)';
			dbservice.runQuery(Query,
										[
											answer, startedTime, 
											localStorage.get('userId'),'app','NULL',uniqueKey, 
											//JSON.stringify($cordovaDevice.getDevice()),
											'device_details',
											localStorage.get('userId'), 
											timeStamp(), QuestionIndex,
											'incomplete',
											questionData.group_id,
											timeStamp()
										],
			function(res) {
	          console.log("record created ");
	          localStorage.set('record_id',res.insertId);
	        }, function (err) {
	          console.log(err);
	        });
		}
		
	}

}).controller('surveyGroupCtrl',function($scope, $ionicLoading, localStorageService, $state, appData){

    
}).controller('IndexCtrl',function($scope,$state,$ionicPopup, $timeout,appActivation,$ionicLoading,localStorageService, dbservice){


    if(localStorageService.get('ActivationCode') != null){
        $state.go('login');
    }
   
    $scope.Activate = function() {
      $scope.data = {};
      console.log('Button Click');
      var index = 1;
      // An elaborate, custom popup
      $ionicPopup.show({
        templateUrl: 'templates/activation-dialog.html',
        title: 'Enter Activation Code',
        subTitle: 'Contact Admin for this code',
        scope: $scope,
        buttons: [
          { text: 'Cancel', onTap: function(e) { return true; } },
          {
            text: '<b>Activate</b>',
            type: 'button-positive',
            onTap: function(e) {
              if(index > 1){
                  return false;
              }
              index++;
              if (!$scope.data.wifi) {
                $ionicLoading.show({
                  template: 'Please fill code!',
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
                    }else{
                      var questionsColumn = '';
                      var insertQuestionMark = '';
                      var insertColumnsName = '';
                      var questionsList = res.data.questions;
                      var users = res.data.users;
                      var surveys = res.data.surveys;
                      var surveySections = res.data.groups;

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

                      //create survey results table
                      var surveyQuestions = '';
                      angular.forEach(surveys, function(value, key) {
	                      	surveyQuestions = $.grep(questionsList,function(grepVal){
	                      		return grepVal.survey_id == value.id;
	                      	});
	                      	var surveyResulColumns = '';
	                      	angular.forEach(surveyQuestions, function(val){
	                        	surveyResulColumns += val.question_key+ ' text, ';
	                      	});
	                      	var Query = 'DROP TABLE IF EXISTS survey_result_'+value.id;
	                      	dbservice.runQuery(Query,[],function(res) {
	                            var Query = 'CREATE TABLE IF NOT EXISTS survey_result_'+value.id+'(id integer primary key,'+surveyResulColumns+' ip_address text, survey_started_on text, survey_completed_on text, survey_submitted_by text, survey_submitted_from text, mac_address text, imei text, unique_id text, device_detail text, created_by text, created_at text, last_field_id integer, last_group_id integer, completed_groups text, survey_status text, incomplete_name text, survey_sync_status text)'
	                            dbservice.runQuery(Query,[],function(res) {
	                            	//console.log(res);
	                            },function(error){
	                            	console.log(error);
	                            });
	                      	});
                      });
						//create survey table results end
						
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
                                              }else if(key == 'fields'){
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
                                      // console.log(insertColumnsName);
                                      // console.log(dataArray);
                                      // console.log(insertQuestionMark);
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



                      //localStorageService.set('UsersData',res.data.users);
                      //localStorageService.set('SurveyData',res.data.surveys);
                      //localStorageService.set('GroupsData',res.data.groups);
                      //localStorageService.set('QuestionData',res.data.questions);
                      localStorageService.set('ActivationCode',$scope.data.wifi);
                      //localStorageService.set('SurveyMedia',res.data.media);

                      if(res.data.media != 'null'){

                        angular.forEach(res.data.media, function(mediaLink, mediaKey){

                            var fileSplited = mediaLink.split('/');
                            var fileLength = fileSplited.length;
                            var fileName = fileSplited[fileLength-1];

                            // console.log(fileName);
                            // console.log(mediaLink);

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

                      $ionicLoading.hide();
                      $ionicLoading.show({
                        template: 'Activated Successfully',
                        noBackdrop: false,
                        duration: 1000
                      });
                      $state.go('login');
                    }
                    
                });
                
              }
            }
          }
        ]
      });
     };

});

//function crea

