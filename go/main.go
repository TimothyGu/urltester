package main

import (
	"fmt"
	"net/url"
	"os"
	"reflect"
	"runtime"
)

func main() {
	fmt.Printf("Running on %s\n", runtime.Version())
	fmt.Printf("compiled with %s for %s/%s\n", runtime.Compiler, runtime.GOOS, runtime.GOARCH)
	fmt.Println()

	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "Usage: %s <url>\n", os.Args[0])
		os.Exit(1)
	}

	fmt.Printf("parsing %#v\n", os.Args[1])

	u, err := url.Parse(os.Args[1])
	if err != nil {
		panic(fmt.Errorf("Failed to parse URL: %w", err))
	}

	vPtr := reflect.ValueOf(u)
	tPtr := vPtr.Type()
	v, t := vPtr.Elem(), tPtr.Elem()
	for i := 0; i < t.NumField(); i++ {
		f := t.Field(i)
		fmt.Printf("URL.%s: %#v\n", f.Name, v.Field(i))
	}
	for i := 0; i < tPtr.NumMethod(); i++ {
		m := tPtr.Method(i)
		if m.Type.NumIn() > 1 {
			// fmt.Printf("skip URL.%v(): require arguments\n", m.Name)
			continue
		} else if m.Type.NumOut() == 0 {
			// fmt.Printf("skip URL.%v(): no result\n", m.Name)
			continue
		} else if m.Type.NumOut() > 1 {
			// fmt.Printf("skip URL.%v(): multiple results\n", m.Name)
			continue
		}
		fmt.Printf("URL.%s(): %#v\n", m.Name, m.Func.Call([]reflect.Value{vPtr})[0])
	}
}
