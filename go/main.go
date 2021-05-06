package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"runtime"
)

var base = flag.String("base", "", "base URL to parse against")

func printURL(u *url.URL) {
	fmt.Printf("String:   %#v\n", u.String())
	fmt.Printf("Scheme:   %#v\n", u.Scheme)
	fmt.Printf("User:     %#v\n", u.User)
	fmt.Printf("Host:     %#v (%#v, %#v)\n", u.Host, u.Hostname(), u.Port())
	fmt.Printf("Path:     %#v (raw: %#v; escaped: %#v)\n", u.Path, u.RawPath, u.EscapedPath())
	fmt.Printf("Opaque:   %#v\n", u.Opaque)
	if u.RawQuery != "" {
		fmt.Printf("RawQuery: %#v\n", u.RawQuery)
	} else if u.ForceQuery {
		fmt.Printf("RawQuery: %#v (force = true)\n", u.RawQuery)
	} else {
		fmt.Printf("RawQuery: nil (force = false)\n")
	}
	fmt.Printf("Fragment: %#v (raw: %#v; escaped: %#v)\n", u.Fragment, u.RawFragment, u.EscapedFragment())
}

func main() {
	flag.Parse()

	fmt.Printf("Running on %s\n", runtime.Version())
	fmt.Printf("compiled with %s for %s/%s\n", runtime.Compiler, runtime.GOOS, runtime.GOARCH)
	fmt.Println()

	if flag.NArg() < 1 {
		flag.Usage()
		os.Exit(1)
	}

	fmt.Printf("parsing %#v\n", flag.Arg(0))

	u, err := url.Parse(flag.Arg(0))
	if err != nil {
		panic(fmt.Errorf("Failed to parse URL: %w", err))
	}
	if *base == "" {
		printURL(u)
	} else {
		fmt.Println()
		fmt.Printf("parsing base %#v\n", *base)
		baseURL, err := url.Parse(*base)
		if err != nil {
			panic(fmt.Errorf("Failed to parse base URL: %w", err))
		}

		fmt.Println()
		fmt.Printf("resolving URLs\n")
		resolved := baseURL.ResolveReference(u)
		printURL(resolved)
	}
}
