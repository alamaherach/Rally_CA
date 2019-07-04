Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        //Write app code here


        this.object_count = 0; // object to be loaded count, this prevent the vpde to run before the necessary data is available 
        
        // console.log('-13 ' ,countDaysSince(new Date('2017-10-10') )); 
        // console.log('2 ' ,countDaysSince(new Date('2017-10-25') ));         
        // console.log('7 ' ,countDaysSince(new Date('2017-10-30') ));           
        // console.log('-27' ,countDaysSince(new Date('2017-9-25') ));         

      
       this._loadIterations();
      
      
    },
      
      
  /**  * Get iterationscomboBox  */
    _loadIterations : function (){
       var app = this;
        app.iterComboBox =  {
           xtype:'rallyiterationcombobox',
           itemId: 'iterComboBox-id',
           fieldLabel:'terations',
           labelAlign:'right',
        //   width:300,           
           listeners:{
              ready:  app._loadStoriesRecords,  // fires when combobox is ready , attaching method to this event
              select: app._loadStoriesRecords,  // fires when user make iteration selection , attaching method to this event
               scope:  app 
           }
      };
    //   this.myContainer.add(this.iterComboBox);
    app.add(app.iterComboBox);
    },
    
  /**  * get stories records using rally data store    */
   _loadStoriesRecords:function (){
        var app = this;
       
        var selectedIterationRef = app.down('#iterComboBox-id').getRecord().get('_ref');  
        // console.log(" selectedIterationRef " , selectedIterationRef); // get selected iteration name  
        
        var filter1 =  Rally.data.wsapi.Filter.fromQueryString('(Iteration = "'+ selectedIterationRef +'")'); 

        var storyFilters =   filter1; // filter1.and( filter2.or(filter3) );

        Ext.create('Rally.data.wsapi.Store', {
            model: 'hierarchicalrequirement', 
            filters: storyFilters,            
            autoLoad: true,
            limit: Infinity,
            sorters: [
                        { property: 'Rank', direction: 'ASC' }
                     ],  
            // limit: 500, // for quick debugging 
            listeners: {
                // load: app._start,
                load: function(store, data) {
                       console.log('loaded story data ', data);
                       app.object_count++; 
                       app.stories = data; // store stories' record data for later use
                       app._start("User Stories");       // process stories' record
                },
                scope: app
            },
          fetch: ['FormattedID', 'Name','Project','ScheduleState','PlanEstimate','c_AcceptanceCriteria','Defects:Summary[State]','Tasks','TaskRemainingTotal','TaskActualTotal','TaskEstimateTotal','Blocked','InProgressDate','Iteration']
        });            
    },   
    
   /** * main method , start computing when all data is loaded  */
   _start:function(from){
        var app = this; 

        app.sprint_statistics_count    = {
                                          '% Done'                              : 0,       
                                          '% WIP'                               : 0,  
                                          'Committed'                           : 0,                                          
                                          'Not started'                         : 0,
                                          'Active'                              : 0,       
                                          'Done'                                : 0,   
                                          'Active older than 3 days'            : 0,
                                          'Blocked'                             : 0,                                          
                                          'Unestimated'                         : 0, 
                                          'Without tasks'                       : 0,
                                          'Not accepted with todo = 0'          : 0,     
                                          'Accepted with todo > 0'              : 0,
                                          'Can be accepted today'               : 0,                                     
                                         }; 
        app.sprint_statistics_points   = {
                                          '% Done'                              : 0,      
                                          '% WIP'                               : 0,  
                                          'Committed'                           : 0,                                           
                                          'Not started'                         : 0,
                                          'Active'                              : 0,       
                                          'Done'                                : 0,   
                                          'Active older than 3 days'            : 0,
                                          'Blocked'                             : 0,                                          
                                          'Unestimated'                         : '-', 
                                          'Without tasks'                       : 0, 
                                          'Not accepted with todo = 0'          : 0,   
                                          'Accepted with todo > 0'              : 0,                                  
                                          'Can be accepted today'               : 0,                                     
                                         };
        app.sprint_statistics_capacity = {
                                          '% Done'                              : 0,      
                                          '% WIP'                               : 0,  
                                          'Committed'                           : 0,                                           
                                          'Not started'                         : 0,
                                          'Active'                              : 0,       
                                          'Done'                                : 0,   
                                          'Active older than 3 days'            : 0,
                                          'Blocked'                             : 0,                                          
                                          'Unestimated'                         : 0, 
                                          'Without tasks'                       : '-', 
                                          'Not accepted with todo = 0'          : 0,   
                                          'Accepted with todo > 0'              : 0,                                  
                                          'Can be accepted today'               : 0,                                     
                                         };        
        if(app.object_count !== 1){ // data still loding 
            console.log('Not ready to start, still loading data :', from);
            return;
        }
        
         // data has finished loading 
         console.log('Data load completed at' , from ,' processing has started ',  app.stories, app.sprint_statistics );    
         
        /**************************  Process  User Stories ********************************************************* */ 
        for (var i = 0 ; i < app.stories.length; i++ ){
            app._processUserStories(app.stories[i].data); 
        }

        // % Done
        app.sprint_statistics_count['% Done']    = (100 * ( app.sprint_statistics_count['Done']    / app.sprint_statistics_count['Committed']  ) ).toFixed(2) + '%';
        app.sprint_statistics_points['% Done']   = (100 * ( app.sprint_statistics_points['Done']   / app.sprint_statistics_points['Committed'] ) ).toFixed(2) + '%';
        app.sprint_statistics_capacity['% Done'] = (100 * ( app.sprint_statistics_capacity['Done'] / app.sprint_statistics_capacity['Committed'] ) ).toFixed(2) + '%';
        
        // % WIP
        app.sprint_statistics_count['% WIP']    = (100 * ( app.sprint_statistics_count['Active']    / app.sprint_statistics_count['Committed']  ) ).toFixed(2) + '%';
        app.sprint_statistics_points['% WIP']   = (100 * ( app.sprint_statistics_points['Active']   / app.sprint_statistics_points['Committed'] ) ).toFixed(2) + '%';   
        app.sprint_statistics_capacity['% WIP'] = (100 * ( app.sprint_statistics_capacity['Active'] / app.sprint_statistics_capacity['Committed'] ) ).toFixed(2) + '%'; 
             
        
        
        /************************** Display Result ********************************************************* */          
         app._displayGrid();
         
         app.object_count = 0; //reset 
   },
   
  /**   Process each user story and update counters   */
   _processUserStories:function(story){
       var app = this;
       
       console.log(' porcesssing story #', story.FormattedID);
       
       // Committed 
       app.sprint_statistics_points['Committed']   += story.PlanEstimate; 
       app.sprint_statistics_count['Committed']    ++;
       app.sprint_statistics_capacity['Committed'] += story.TaskEstimateTotal; 
       
       // Not started
        if(story.ScheduleState === "Defined"  ) { 
           app.sprint_statistics_points['Not started'] += story.PlanEstimate; 
           app.sprint_statistics_count['Not started'] ++; 
           app.sprint_statistics_capacity['Not started'] += story.TaskRemainingTotal;            
        }      
       // Done 
        if(story.ScheduleState === "Accepted"  ) { 
           app.sprint_statistics_points['Done'] += story.PlanEstimate; 
           app.sprint_statistics_count['Done'] ++; 
           app.sprint_statistics_capacity['Done'] += story.TaskActualTotal;               
        }    
       //Blocked
       if(story.Blocked) { 
           app.sprint_statistics_points['Blocked'] += story.PlanEstimate; 
           app.sprint_statistics_count['Blocked'] ++; 
           app.sprint_statistics_capacity['Blocked'] += story.TaskRemainingTotal;               
        }  
        //Without tasks
        if( story.Tasks.Count === 0){
           app.sprint_statistics_points['Without tasks'] += story.PlanEstimate; 
           app.sprint_statistics_count['Without tasks'] ++; 
        //   app.sprint_statistics_capacity['Without task'] = '-';               
        }         
        //Accepted with todo > 0
        if( (story.ScheduleState === 'Accepted') &&  (story.TaskRemainingTotal >  0) ){
           app.sprint_statistics_points['Accepted with todo > 0'] += story.PlanEstimate; 
           app.sprint_statistics_count['Accepted with todo > 0'] ++; 
           app.sprint_statistics_capacity['Accepted with todo > 0'] += story.TaskRemainingTotal;               
        }  
        //Not accepted with todo = 0
        if( (story.ScheduleState !== 'Accepted') &&  (story.TaskRemainingTotal ===  0) ){
           app.sprint_statistics_points['Not accepted with todo = 0'] += story.PlanEstimate; 
           app.sprint_statistics_count['Not accepted with todo = 0'] ++; 
        //  app.sprint_statistics_capacity['Not accepted with todo = 0'] += story.TaskRemainingTotal;               
        }   
        //Can be accepted today
        if( (story.ScheduleState !== 'Accepted') &&  (story.TaskRemainingTotal <= 6) ){
           app.sprint_statistics_points['Can be accepted today'] += story.PlanEstimate; 
           app.sprint_statistics_count['Can be accepted today'] ++; 
           app.sprint_statistics_capacity['Can be accepted today'] += story.TaskRemainingTotal;               
        }         
        //Unestimated
        if(story.PlanEstimate === null){
         //   app.sprint_statistics_points['Unestimated'] = '-'; 
           app.sprint_statistics_count['Unestimated'] ++; 
           app.sprint_statistics_capacity['Unestimated'] += story.TaskRemainingTotal;               
        }          
        
       //Active
        if(story.ScheduleState === "In-Progress"  || story.ScheduleState === "Completed") { 
           app.sprint_statistics_points['Active'] += story.PlanEstimate; 
           app.sprint_statistics_count['Active'] ++;
           app.sprint_statistics_capacity['Active'] += story.TaskRemainingTotal;               
            
            //Active older than 3 days
                 if(countDaysSince(story.InProgressDate) <= -3) {  
                       app.sprint_statistics_points['Active older than 3 days'] += story.PlanEstimate; 
                       app.sprint_statistics_count['Active older than 3 days'] ++;  
                       app.sprint_statistics_capacity['Active older than 3 days'] += story.TaskRemainingTotal;                           
                 }      
        }
       
   }, 
   
  /**   * Display the repot "Jason Object" in a Grid    */
  _displayGrid: function(){
      var app = this; 
      app.sprint_stat_store = {}; //reset 
        
     if(app.myGrid){ // Destroy grid if it already exist 
        app.myGrid.destroy(); 
      }      

      // legend
      var legend = "What's story does your sprint tell?"; 
        
     // build store data 
      var my_data=[];
      for (var key in  app.sprint_statistics_count  ){
        if ( app.sprint_statistics_count.hasOwnProperty(key)) {
            //  console.log("Key is " + key + ", value is" + app.sprint_statistics [key]);
             my_data.push({ 'Metrics': key, 'Count': app.sprint_statistics_count[key], 'Points': app.sprint_statistics_points[key], 'Capacity': app.sprint_statistics_capacity[key] }); 
        }
    }
     console.log(' my_data ', my_data );
            
     app.sprint_stat_store = Ext.create('Ext.data.Store', {
        storeId:'Sprint_Health',
        fields:['Metrics', 'Count','Points','Capacity'],
        data: my_data,
        proxy: {
            type: 'memory',
            reader: {
                type: 'json',
                root: 'items'
            }
        }
     });
    //   console.log(' app.sprint_stat_store ', app.sprint_stat_store );
        
    app.myGrid = Ext.create('Ext.grid.Panel', {
        title: 'Sprint Statistcs',
        store: app.sprint_stat_store ,
        columns: [
                    { text: 'Metrics'    , dataIndex: 'Metrics'       ,width:'35%' },
                    { text: 'Count', dataIndex: 'Count'  },
                    { text: 'Points', dataIndex: 'Points'  }, 
                    { text: 'Capacity', dataIndex: 'Capacity'  }
                ],
        height: 800,
        width: '100%',   
        maxHeight:'100%',
        tbar: [ { xtype: 'label', html: legend }],
        renderTo: Ext.getBody()
    }); 
    
    app.add(app.myGrid);
   },   
   
});


// Utilities 

/**
* Compute number of days since a given date 
* Positive number represents # days in future from today
* Negative number represents # days past till today
*/      
function countDaysSince (given_date) {
    var today = new Date();

    // console.log(' called countDaysSince: ', given_date, " from today: ",today);       

    var days_count =  Math.round((given_date-today)/(1000*60*60*24));  
    console.log('days_count', days_count ,' from given_date', given_date);  
    return days_count;        
    }   