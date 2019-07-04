# RallyRestforJavaSetupAndExamples



Dependencies ready to use (use if you are not using an IDE)
1) Dependencies > Lib-unpacked. contains all the compile classes dependencies you need 
   for Rallty Rest Application


Dependencies unpacked (easier to setup using in IDE) 
2) Dependencies > Lib-jar. contains all jar needed for for Rallty Rest Application
                add Jar to your class path in IDE
                or unzip them to create Lib-unpacked
                ignore examples folder 

Rally App Services Examples
3) rally-java-rest-apps. contains apps that are written with Rally REST Toolkit for Java
    you can start using them and customize them to your need
    you can get this from git: https://github.com/RallyCommunity/rally-java-rest-apps.git



Dependencies orginal (https://github.com/RallyTools/RallyRestToolkitForJava/wiki/User-Guide#setup) 
4)  RallyRestToolkitForJava>src. the orginal java classes dependencies 
     you can get this form git: https://github.com/RallyTools/RallyRestToolkitForJava.git
    Note this git is missing the following (they are included in Dependencies > Lib-jar or you can redownload them from) 
       https://github.com/RallyTools/RallyRestToolkitForJava/releases/download/v2.2.1/rally-rest-api-2.2.1.jar
             Rally-rest-api-2.2.1.jar: 
       http://archive.apache.org/dist/httpcomponents/httpclient/binary/httpcomponents-client-4.2.5-bin.zip
            httpcore-4.2.4.jar
            httpclient-4.2.5.jar
            commons-logging-1.1.1.jar
            commons-codec-1.6.jar
      https://mvnrepository.com/artifact/com.google.code.gson/gson/2.2.4 
            gson-2.2.4.jar
     Install maven : sudo apt-get install maven
     install packages: mvn package         OR (mvn install)
        this it will create classes dependecies in folder target>classes         
        
        
Working Examples 
provide  a working exanmple (No IDE set up needed) just complile and run. But first 
in CreateUserSetProjectPermissions.java replace API_KEY_123 with a real api_key
compile and run to create user and set permission 
