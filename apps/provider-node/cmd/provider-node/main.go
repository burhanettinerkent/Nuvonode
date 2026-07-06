package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/nuvonode/nuvonode/apps/provider-node/internal/config"
	"github.com/nuvonode/nuvonode/apps/provider-node/internal/node"
)

func main() {
	cmd := "help"
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}
	switch cmd {
	case "serve":
		path := configArg(os.Args[2:])
		if path == "" {
			p, err := config.DefaultPath()
			if err != nil {
				fatal(err)
			}
			path = p
		}
		if err := node.Serve(context.Background(), node.ServeOptions{ConfigPath: path}); err != nil {
			fatal(err)
		}
	case "doctor":
		path := configArg(os.Args[2:])
		if path == "" {
			p, err := config.DefaultPath()
			if err != nil {
				fatal(err)
			}
			path = p
		}
		fmt.Println("Nuvonode Provider Doctor")
		result := node.Doctor(context.Background(), path)
		for _, msg := range result.Messages {
			fmt.Println(msg)
		}
		if !result.OK {
			os.Exit(1)
		}
	case "init":
		if err := node.Init(os.Args[2:]); err != nil {
			fatal(err)
		}
		fmt.Println("[ok] config written")
	default:
		fmt.Println("usage: nuvonode-provider [init|doctor|serve]")
	}
}

func configArg(args []string) string {
	for i, arg := range args {
		if arg == "--config" && i+1 < len(args) {
			return args[i+1]
		}
		if value, ok := strings.CutPrefix(arg, "--config="); ok {
			return value
		}
	}
	return ""
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "[fail]", err)
	os.Exit(1)
}
