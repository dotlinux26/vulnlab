#include <iostream>
#include <vector>
#include <fstream>

int main()
{
    std::ofstream fo("shellext.txt",std::ios::app);
    std::ifstream fi("web-extensions.txt");
    
    std::vector<std::string> a = {"%20","%0a","%00","%0d0a","/",".\\",".","…",":"};
    std::vector<std::string> b;
    std::string get;
    while (fi >> get) {
        b.push_back(get);
    }
   
    for (int i = 0;i < a.size();i++) {
        for (int j = 0;j < b.size();j++) {
            fo << "shell" << a[i] << b[j] << ".jpeg" << "\n";
            fo << "shell" << b[j] << a[i] << ".jpeg" << "\n";
            fo << "shell.jpeg" << a[i] << b[j] << "\n";
            fo << "shell.jpeg" << b[j] << a[i] << "\n";
        }
    }
}
