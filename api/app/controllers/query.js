const querySelector = (category, user) => {
  return `
    select a.*
    from (select boards.id,
                 boards.title,
                 boards.contents,
                 boards.writer,
                 boards.is_delete,
                 boards.category,
                 boards.writing_type,
                 boards.color_type,
                 boards.view_count,
                 boards.created_by,
                 boards.updated_by,
                 boards.created_at,
                 boards.updated_at,
                 0 < (SELECT COUNT(*)
                      FROM block_user_lists
                      WHERE user_id = ${user}
                        AND boards.writer = block_user_id) AS isBlock,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND good = true)                       AS good_count,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND hate = true)                       AS hate_count,
                 (select count(1)
                  from comments
                  where boards.id = comments.type_id
                    AND type = 'board')                    AS comment_count,
                 (select count(1)
                  from re_comments
                  where boards.id = re_comments.type_id
                    AND type = 'board')                    AS re_comment_count,
                 U.nick_name
          from boards
                 INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
            AND boards.writing_type != N'일반 게시물'
            AND boards.category = ${category}
          ORDER BY boards.created_at DESC
          OFFSET 0 LIMIT 20) as a
    UNION ALL
    select b.*
    from (select boards.id,
                 CASE
                   WHEN 0 < (SELECT COUNT(*)
                             FROM block_user_lists
                             WHERE user_id = ${user}
                               AND boards.writer = block_user_id)
                     THEN N'차단된 멤버의 게시글입니다.'
                   ELSE boards.title
                   END                                     AS title,
                 CASE
                   WHEN 0 < (SELECT COUNT(*)
                             FROM block_user_lists
                             WHERE user_id = ${user}
                               AND boards.writer = block_user_id)
                     THEN ''
                   ELSE boards.contents
                   END                                     AS contents,
                 boards.writer,
                 boards.is_delete,
                 boards.category,
                 boards.writing_type,
                 boards.color_type,
                 boards.view_count,
                 boards.created_by,
                 boards.updated_by,
                 boards.created_at,
                 boards.updated_at,
                 0 < (SELECT COUNT(*)
                      FROM block_user_lists
                      WHERE user_id = ${user}
                        AND boards.writer = block_user_id) AS isBlock,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND good = true)                       AS good_count,
                 (select count(1)
                  from article_elements
                  where boards.id = article_elements.type_id
                    AND type = 'board'
                    AND hate = true)                       AS hate_count,
                 (select count(1)
                  from comments
                  where boards.id = comments.type_id
                    AND type = 'board')                    AS comment_count,
                 (select count(1)
                  from re_comments
                  where boards.id = re_comments.type_id
                    AND type = 'board')                    AS re_comment_count,
                 U.nick_name
          from boards
                 INNER JOIN "users-permissions_user" AS U ON (boards.writer = U.id)
          WHERE boards.is_delete = false
            AND boards.writing_type = N'일반 게시물'
            AND boards.category = ${category}
          ORDER BY boards.created_at DESC
          OFFSET 0 LIMIT 20) as b
  `
}

const handleCount = (category) => {
  return `
    SELECT COUNT(*)
    FROM boards
    WHERE boards.is_delete = FALSE
      AND boards.writing_type = N'일반 게시물'
      AND boards.category = ${category}`
}

module.exports = {
  querySelector,
  handleCount,
}
