package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

var (
	sc *bufio.Scanner
)

func main() {
	fmt.Println("****************************************************")
	fmt.Println("*** Automatisation import/export base de données ***")
	fmt.Println("****************************************************")

	sc = bufio.NewScanner(os.Stdin)

	c := exec.Command(
		"cmd",
		"/C",
		"py",
		"E:\\Pour_Discord\\PoltergeistBot\\database\\SFTP\\main.py")
	c.Args = append(c.Args, askParameters()...)
	out, err := c.CombinedOutput()

	fmt.Printf(`
	
-----------------------
Script Python:

%s
-----------------------


`,
		string(out))

	checkAndPanic(err)
}

func askParameters() []string {
	params := []string{}

	params = append(params,
		ask("\nLe programme doit-il écraser le fichier si il est existant (y/n):", []string{"y", "n"}),
		ask("\nRentrez le mode que vous souhaitez exécuter (get/put):", []string{"get", "put"}),
		ask("\nRentrez tous les fichiers qui doivent être importés/exportés:", []string{}))

	temp := []string{}
	for _, x := range params {
		x = strings.TrimSpace(x)
		if x == "" || x == " " {
			continue
		} else if x == "y" {
			x = "True"
		} else if x == "n" {
			x = "False"
		}
		temp = append(temp, x)
	}
	return temp
}

func ask(q string, cI []string) string {
	var r string
	for true {
		fmt.Println(q)
		sc.Scan()
		r = strings.ToLower(strings.TrimSpace(sc.Text()))
		if len(cI) == 0 || arrayContains(cI, r) {
			break
		}
	}
	return r
}

func arrayContains(arr []string, str string) bool {
	for _, a := range arr {
		if str == a {
			return true
		}
	}
	return false
}

func checkAndPanic(err error) {
	if err != nil {
		panic("Une erreur est survenue: " + err.Error())
	}
}
