#define _POSIX_C_SOURCE 200809L

#include <curl/curl.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static const char *url_strerr(CURLUcode rc) {
  switch (rc) {
    case CURLUE_OK:
      return "OK";
    case CURLUE_BAD_HANDLE:
      return "bad handle";
    case CURLUE_BAD_PARTPOINTER:
      return "bad part pointer";
    case CURLUE_MALFORMED_INPUT:
      return "malformed input";
    case CURLUE_BAD_PORT_NUMBER:
      return "bad port number";
    case CURLUE_UNSUPPORTED_SCHEME:
      return "unsupported scheme";
    case CURLUE_URLDECODE:
      return "urldecode";
    case CURLUE_OUT_OF_MEMORY:
      return "out of memory";
    case CURLUE_USER_NOT_ALLOWED:
      return "user not allowed";
    case CURLUE_UNKNOWN_PART:
      return "unknown part";
    case CURLUE_NO_SCHEME:
      return "no scheme";
    case CURLUE_NO_USER:
      return "no user";
    case CURLUE_NO_PASSWORD:
      return "no password";
    case CURLUE_NO_OPTIONS:
      return "no options";
    case CURLUE_NO_HOST:
      return "no host";
    case CURLUE_NO_PORT:
      return "no port";
    case CURLUE_NO_QUERY:
      return "no query";
    case CURLUE_NO_FRAGMENT:
      return "no fragment";
    default:
      return "unknown error";
  };
}

static void print(const char *str) {
  if (str) {
    printf("\"%s\"", str);
  } else {
    printf("(null)");
  }
}

static void get_and_print(CURLU *h, CURLUPart part, CURLUcode no_part,
                          const char *description) {
  char *str = NULL;
  char *decoded_str = NULL;

  if (no_part < 0) {
    no_part = CURLUE_UNKNOWN_PART;
  }

  CURLUcode rc = curl_url_get(h, part, &str, 0);
  if (rc == no_part) {
    str = NULL;
  } else if (rc) {
    fprintf(stderr, "Failed to get %s: %s\n", description, url_strerr(rc));
    goto end;
  }

  printf("%s: ", description);
  print(str);

  if (part != CURLUPART_URL && part != CURLUPART_SCHEME &&
      part != CURLUPART_PORT) {
    rc = curl_url_get(h, part, &decoded_str, CURLU_URLDECODE);
    if (no_part >= 0 && rc == no_part) {
      decoded_str = NULL;
    } else if (rc) {
      fprintf(stderr, "Failed to get %s: %s\n", description, url_strerr(rc));
      goto end;
    }
    printf(" (decoded: ");
    print(decoded_str);
    printf(")");
  }

  printf("\n");

end:
  curl_free(str);
  curl_free(decoded_str);
}

static void print_help(const char *argv0) {
  fprintf(stderr,
          "Usage: %s [OPTION]... <URL>\n"
          " -b <url> Base URL\n"
          " -e       Encode URL components while parsing\n"
          " -h       Print this help\n",
          argv0);
}

int main(int argc, char *argv[]) {
  // for main() reentrance in WebAssembly
  optind = 1;

  char *base_url = NULL;
  bool encode_url = false;
  bool failed = false;
  CURLU *h = NULL;

  // Disable icky stdout/err buffering.
  setvbuf(stderr, NULL, _IONBF, 0);
  setvbuf(stdout, NULL, _IONBF, 0);

  int opt;
  while ((opt = getopt(argc, argv, "b:eh")) != -1) {
    switch (opt) {
      case 'b':
        free(base_url);
        base_url = strdup(optarg);
        break;
      case 'e':
        encode_url = true;
        break;
      case 'h':
        print_help(argv[0]);
        goto end;
      default:
        print_help(argv[0]);
        failed = true;
        goto end;
    }
  }

  if (optind >= argc) {
    fprintf(stderr, "No URL found\n");
    print_help(argv[0]);
    failed = true;
    goto end;
  }

  const char *url_to_parse = argv[optind];

  // Always enable non-supported scheme, as URL parsing is not affected.
  unsigned int parse_flags = CURLU_NON_SUPPORT_SCHEME;
  if (encode_url) {
    parse_flags |= CURLU_URLENCODE;
  }

  printf("using %s\n\n", curl_version());

  h = curl_url();
  CURLUcode rc = CURLUE_OK;

  if (base_url) {
    printf("parsing base \"%s\"\n", base_url);
    rc = curl_url_set(h, CURLUPART_URL, base_url, parse_flags);
    if (rc) {
      fprintf(stderr, "Failed to parse base URL: %s\n", url_strerr(rc));
      failed = true;
      goto end;
    }
    printf("\n");
  }

  printf("parsing \"%s\"\n", url_to_parse);
  rc = curl_url_set(h, CURLUPART_URL, url_to_parse, parse_flags);
  if (rc) {
    fprintf(stderr, "Failed to parse URL: %s\n", url_strerr(rc));
    failed = true;
    goto end;
  }

  get_and_print(h, CURLUPART_URL, -1, "roundtripped");
  get_and_print(h, CURLUPART_SCHEME, CURLUE_NO_SCHEME, "scheme");
  get_and_print(h, CURLUPART_USER, CURLUE_NO_USER, "user");
  get_and_print(h, CURLUPART_PASSWORD, CURLUE_NO_PASSWORD, "password");
  get_and_print(h, CURLUPART_OPTIONS, CURLUE_NO_OPTIONS, "options");
  get_and_print(h, CURLUPART_HOST, CURLUE_NO_HOST, "host");
  get_and_print(h, CURLUPART_PORT, CURLUE_NO_PORT, "port");
  get_and_print(h, CURLUPART_PATH, -1, "path");
  get_and_print(h, CURLUPART_QUERY, CURLUE_NO_QUERY, "query");
  get_and_print(h, CURLUPART_FRAGMENT, CURLUE_NO_FRAGMENT, "fragment");
  get_and_print(h, CURLUPART_ZONEID, -1, "zone id");

end:
  curl_url_cleanup(h);
  free(base_url);
  return failed ? EXIT_FAILURE : EXIT_SUCCESS;
}
