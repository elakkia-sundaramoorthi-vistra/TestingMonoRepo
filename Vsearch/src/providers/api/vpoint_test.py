import mysql.connector
mydb = mysql.connector.connect(
  host="viewpoint-country4.cwj3srrixzjs.eu-west-1.rds.amazonaws.com",
  user="vsearch",
  password="VistraSecure2021!"
  # Database : vp_vistra_weu_country4
)

print(mydb)