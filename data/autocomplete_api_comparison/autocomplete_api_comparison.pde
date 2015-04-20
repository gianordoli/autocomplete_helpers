StringList country = new StringList();
StringList usa = new StringList();
int differences = 0;
void setup(){
  String[] data = loadStrings("pt_br.txt");
  for(int i = 1; i < data.length; i++){
    String[] row = split(data[i], '\t');
    country.append(row[0]);
    usa.append(row[1]);
  }
  
  for(int i = 0; i < country.size(); i++){
    if(!usa.hasValue(country.get(i))){
      differences ++;
      println("oops");
    }
  }
  println(differences);
}

void draw(){

}
