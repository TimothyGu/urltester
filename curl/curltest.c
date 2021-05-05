#define _POSIX_C_SOURCE 200809L

#include <curl/curl.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

static void get_and_print(CURLU *h, CURLUPart part, CURLUcode no_part,
                          const char *description) {
  char *str = NULL;
  char *decoded_str = NULL;

  CURLUcode rc = curl_url_get(h, part, &str, 0);
  if (no_part >= 0 && rc == no_part) {
    str = NULL;
  } else if (rc) {
    fprintf(stderr, "Failed to get %s: %d\n", description, rc);
    goto end;
  }

  rc = curl_url_get(h, part, &decoded_str, CURLU_URLDECODE);
  if (no_part >= 0 && rc == no_part) {
    decoded_str = NULL;
  } else if (rc) {
    fprintf(stderr, "Failed to get %s: %d\n", description, rc);
    goto end;
  }

  if (str && decoded_str) {
    printf("%s:         \"%s\"\n", description, str);
    printf("%s decoded: \"%s\"\n", description, decoded_str);
  } else if (!str && decoded_str) {
    printf("%s:         (null)\n", description);
    printf("%s decoded: \"%s\"\n", description, decoded_str);
  } else if (str && !decoded_str) {
    printf("%s:         \"%s\"\n", description, str);
    printf("%s decoded: (null)\n", description);
  } else {
    printf("%s:         (null)\n", description);
    printf("%s decoded: (null)\n", description);
  }

end:
  curl_free(str);
  curl_free(decoded_str);
}

static void print_help(const char *argv0) {
  fprintf(stderr,
          "Usage: %s [OPTION]... <URL>\n"
          " -e     Encode URL components while parsing\n"
          " -h     Print this help\n",
          argv0);
}

int main(int argc, char *argv[]) {
  // Disable icky stdout/err buffering.
  setvbuf(stderr, NULL, _IONBF, 0);
  setvbuf(stdout, NULL, _IONBF, 0);

  bool encode_url = false;

  int opt;
  while ((opt = getopt(argc, argv, "eh")) != -1) {
    switch (opt) {
      case 'e':
        encode_url = true;
        break;
      case 'h':
        print_help(argv[0]);
        return EXIT_SUCCESS;
      default:
        print_help(argv[0]);
        return EXIT_FAILURE;
    }
  }

  if (optind >= argc) {
    fprintf(stderr, "No URL found\n");
    print_help(argv[0]);
    return EXIT_FAILURE;
  }

  const char *url_to_parse = argv[optind];

  // Always enable non-supported scheme, as URL parsing is not affected.
  unsigned int parse_flags = CURLU_NON_SUPPORT_SCHEME;
  if (encode_url) {
    parse_flags |= CURLU_URLENCODE;
  }

  printf("using %s\n\n", curl_version());
  printf("parsing \"%s\"\n", url_to_parse);

  CURLU *h = curl_url();
  CURLUcode rc = CURLUE_OK;
  rc = curl_url_set(h, CURLUPART_URL, url_to_parse, parse_flags);
  if (rc) {
    fprintf(stderr, "Failed to parse URL: %d\n", rc);
    abort();
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

  curl_url_cleanup(h);
  return EXIT_SUCCESS;
}
