#You will need to install the mysql.connector module
#To do that use pip install mysql-connector-python
import mysql.connector
#Testing connection with the MySQL
mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    #Not sure why, but got problems setting password, just worked withou any password
    password="",
    database="myNewDB"
)


mycursor = mydb.cursor()

#Creating database
# mycursor.execute("CREATE DATABASE myNewDB")


#checking if the database exists

# mycursor.execute("SHOW DATABASES")

# for x in mycursor:
#     print(x)


#CREATING NEW TABLE
# mycursor.execute("CREATE TABLE testONE (name VARCHAR(50), address VARCHAR(50))")


mycursor.execute("SHOW TABLES")

for x in mycursor:
    print(x)