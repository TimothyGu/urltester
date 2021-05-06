#include <assert.h>
#include <limits.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

struct string_builder {
  char *buf;
  ssize_t len;
  ssize_t cap;
};

static struct string_builder new_string_builder(ssize_t init) {
  ssize_t cap = 0;
  char *buf = NULL;
  if (init > 0) {
    buf = calloc(init, 1);
    assert(buf);
    cap = init;
  }
  return (struct string_builder){
      .buf = buf,
      .len = 0,
      .cap = cap,
  };
}

static void grow(struct string_builder *builder, ssize_t need) {
  assert(need > 0);
  assert(builder->cap < (SSIZE_MAX - need) / 2);
  ssize_t orig_cap = builder->cap;
  ssize_t new_cap = orig_cap * 2 + need;
  char *new_buf = realloc(builder->buf, new_cap);
  assert(new_buf);
  memset(&new_buf[orig_cap], 0, new_cap - orig_cap);
  builder->buf = new_buf;
  builder->cap = new_cap;
}

static inline void append_char(struct string_builder *builder, char ch) {
  if (builder->len >= builder->cap) {
    grow(builder, 1);
  }
  builder->buf[builder->len] = ch;
  builder->len++;
}

static inline void append_mem(struct string_builder *builder, const void *mem,
                              ssize_t n) {
  if (builder->len > builder->cap - n) {
    grow(builder, n);
  }
  memmove(&builder->buf[builder->len], mem, n);
  builder->len += n;
}

static inline void append_str(struct string_builder *builder, const char *str) {
  append_mem(builder, str, strlen(str));
}

static inline char *release_builder(struct string_builder *builder) {
  append_char(builder, '\0');
  char *buf = builder->buf;
  builder->buf = NULL;
  builder->len = 0;
  builder->cap = 0;
  return buf;
}
