package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/url"
	"os"
	"runtime"
	"strings"
	"unicode"

	"golang.org/x/net/idna"
)

var (
	base    = flag.String("base", "", "base URL to parse against")
	useIDNA = flag.Bool("idna", false, "use net/http IDNA conversion")
)

type URLJSON struct {
	Href                                   string
	Scheme                                 string
	Username, Password                     *string
	Host, Hostname, Port                   string
	Path, RawPath, EscapedPath             string
	Opaque                                 string
	Query                                  map[string][]string
	RawQuery                               *string
	Fragment, RawFragment, EscapedFragment string
}

func NewURLJSON(u *url.URL) URLJSON {
	var obj URLJSON
	obj.Href = u.String()
	obj.Scheme = u.Scheme
	if user := u.User; user != nil {
		username := user.Username()
		obj.Username = &username
		if passwd, ok := user.Password(); ok {
			obj.Password = &passwd
		}
	}
	obj.Host, obj.Hostname, obj.Port = u.Host, u.Hostname(), u.Port()
	obj.Path, obj.RawPath, obj.EscapedPath = u.Path, u.RawPath, u.EscapedPath()
	obj.Opaque = u.Opaque
	if u.ForceQuery || u.RawQuery != "" {
		obj.Query = u.Query()
		obj.RawQuery = &u.RawQuery
	}
	obj.Fragment, obj.RawFragment, obj.EscapedFragment = u.Fragment, u.RawFragment, u.EscapedFragment()
	return obj
}

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

func printURLJSON(u *url.URL) {
	urlJSON := NewURLJSON(u)
	b, err := json.Marshal(&urlJSON)
	if err != nil {
		panic(err)
	}
	fmt.Printf("JSON:%s\n", b)
}

func main() {
	flag.Parse()

	fmt.Printf("VERSION:%s\n", runtime.Version()[2:])
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
		panic(err)
	}
	if *base == "" {
		decodeIDNA(u)
		printURL(u)
		printURLJSON(u)
	} else {
		fmt.Println()
		fmt.Printf("parsing base %#v\n", *base)
		baseURL, err := url.Parse(*base)
		if err != nil {
			panic(fmt.Errorf("parse base URL: %w", err))
		}

		fmt.Println()
		fmt.Printf("resolving URLs\n")
		resolved := baseURL.ResolveReference(u)
		decodeIDNA(resolved)
		printURL(resolved)
		printURLJSON(resolved)
	}
}

// Use the same logic as the net/http package.

func decodeIDNA(u *url.URL) {
	if !*useIDNA {
		return
	}
	if v, err := idnaASCII(u.Hostname()); err == nil {
		// Replace only the hostname portion of u.Host.
		// Reverse the logic of URL.Hostname.
		colon := strings.LastIndexByte(u.Host, ':')
		if colon == -1 {
			u.Host = v
		} else {
			u.Host = v + u.Host[colon:]
		}
	}
}

///// From https://github.com/golang/go/blob/go1.17.1/src/net/http/internal/ascii/print.go
///// From https://github.com/golang/go/blob/go1.17.1/src/net/http/request.go

func idnaASCII(v string) (string, error) {
	if isASCII(v) {
		return v, nil
	}
	return idna.Lookup.ToASCII(v)
}

func isASCII(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] > unicode.MaxASCII {
			return false
		}
	}
	return true
}
