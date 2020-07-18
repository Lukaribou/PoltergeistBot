package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func main() {
	fmt.Println("****************************************************")
	fmt.Println("*** Automatisation import/export base de données ***")
	fmt.Println("****************************************************")

	p := askParameters()

	c := exec.Command(
		"cmd",
		"/C",
		"py",
		"E:\\Pour_Discord\\PoltergeistBot\\database\\SFTP\\main.py")
	c.Args = append(c.Args, p...)
	x, err := c.CombinedOutput()
	checkAndPanic(err)
	fmt.Println(string(x))
}

func askParameters() []string {
	params := make([]string, 3)
	input := bufio.NewScanner(os.Stdin)

	fmt.Println("\nLe programme doit-il écraser le fichier si il est existant (y/n):")
	input.Scan()
	panicBadInput(input.Text(), []string{"y", "n"})
	params = append(params, input.Text())

	fmt.Println("\nRentrez le mode que vous souhaitez exécuter (get/put):")
	input.Scan()
	panicBadInput(input.Text(), []string{"get", "put"})
	params = append(params, input.Text())

	fmt.Println("\nRentrez tous les fichiers qui doivent être importés/exportés:")
	input.Scan()
	params = append(params, input.Text())

	temp := ""

	for _, x := range params {
		if x != " " {
			if x == "y" {
				x = "True"
			} else if x == "n" {
				x = "False"
			}
			temp += " " + x
		}
	}

	temp = strings.ReplaceAll(temp, "  ", " ")
	return strings.Split(temp[2:], " ")
}

func arrayContains(arr []string, str string) bool {
	for _, a := range arr {
		if str == a {
			return true
		}
	}
	return false
}

func panicBadInput(input string, correctsInput []string) {
	if !arrayContains(correctsInput, strings.ToLower(input)) {
		panic("Le paramètre donné n'est pas dans les réponses possibles")
	}
}

func checkAndPanic(err error) {
	if err != nil {
		panic("Une erreur est survenue: " + err.Error())
	}
}
