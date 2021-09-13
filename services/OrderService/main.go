package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func HttpGet(url string, c chan<- string) {
	resp, err := http.Get(url)
	if err != nil {
		c <- "error"
		log.Println(err)
	} else {
		defer resp.Body.Close()
		body, _ := ioutil.ReadAll(resp.Body)
		c <- string(body)
	}

}

func fetchServices() []string {
	// fetch other microservices result
	ch := make(chan string, 2)

	microservices := []string{}
	buf := []string{}

	if v, ok := os.LookupEnv("PRODUCT_SVC_URL"); ok {
		fmt.Println("got PRODUCT_SVC_URL")
		PRODUCT_SVC_URL := v
		microservices = append(microservices, PRODUCT_SVC_URL)
		// go HttpGet(PRODUCT_SVC_URL, ch)
	}
	if v, ok := os.LookupEnv("CUSTOMER_SVC_URL"); ok {
		fmt.Println("got CUSTOMER_SVC_URL")
		CUSTOMER_SVC_URL := v
		microservices = append(microservices, CUSTOMER_SVC_URL)
		// go HttpGet(CUSTOMER_SVC_URL, ch)
	}

	for _, url := range microservices {
		fmt.Printf("fetching %s\n", url)
		go HttpGet(url, ch)
	}

	for range microservices {
		o := <-ch
		buf = append(buf, o)
	}
	return buf
}

func main() {

	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		serviceName, versionNum := "undefined", "undefined"

		if v, ok := os.LookupEnv("serviceName"); ok {
			serviceName = v
		}

		if v, ok := os.LookupEnv("versionNum"); ok {
			versionNum = v
		}
		buf := fetchServices()
		c.String(http.StatusOK, "{\"service\":%s, \"version\":%s}\n%s\n", serviceName, versionNum, strings.Join(buf, "\n"))

	})
	r.Run() // listen and serve on 0.0.0.0:8080
}
